import "server-only";

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import { escapeIdentifier, type Pool, type PoolClient } from "pg";
import {
  FORMAT_SAUVEGARDE,
  LIGNES_PAR_LECTURE_SAUVEGARDE,
  TABLES_COMPTES,
  TABLES_JAMAIS_SAUVEGARDEES,
  TAILLE_MAX_INSTRUCTION_SAUVEGARDE,
} from "../constantes.ts";
import { FIN_TRANSACTION, creerSignataire, nomFichierSauvegarde, texteEnTete } from "../metier/sauvegarde.ts";
import { instructionInsert, valeurSql } from "../metier/sauvegarde-sql.ts";
import * as schema from "./schema.ts";

/**
 * Export de toutes les données en un fichier SQL signé, écrit au fil de l'eau.
 * Sans alias `@/` : aussi utilisé par le script en ligne de commande (scripts/sauvegarde.mts).
 */

type DescriptionTable = { nom: string; colonnes: string[]; cle: string[] };
type Requetable = Pick<Pool, "query"> | PoolClient;

const estDans = (liste: readonly string[], nom: string) => liste.includes(nom);

/** Tables du schéma Drizzle (une nouvelle table est sauvegardée sans rien changer ici), sauf sessions et jetons. */
const TABLES: DescriptionTable[] = (Object.values(schema) as unknown[])
  .filter((valeur): valeur is PgTable => is(valeur, PgTable))
  .map((table) => {
    const config = getTableConfig(table);
    const cle = [...config.columns.filter((colonne) => colonne.primary), ...config.primaryKeys.flatMap((cle) => cle.columns)].map((colonne) => colonne.name);
    const colonnes = config.columns.map((colonne) => colonne.name);
    return { nom: config.name, colonnes, cle: cle.length > 0 ? cle : colonnes };
  })
  .filter((table) => !estDans(TABLES_JAMAIS_SAUVEGARDEES, table.nom));

export function tablesSauvegardees(avecComptes: boolean): DescriptionTable[] {
  return avecComptes ? TABLES : TABLES.filter((table) => !estDans(TABLES_COMPTES, table.nom));
}

export function colonnesParTable(avecComptes: boolean): Record<string, string[]> {
  return Object.fromEntries(tablesSauvegardees(avecComptes).map((table) => [table.nom, table.colonnes]));
}

/** Version de la base : nombre de migrations appliquées et date de la dernière (table de drizzle-kit). */
export async function lireVersionMigrations(connexion: Requetable): Promise<string> {
  const { rows } = await connexion.query<{ nombre: number; derniere: string | null }>(
    "SELECT count(*)::int AS nombre, max(created_at)::text AS derniere FROM drizzle.__drizzle_migrations",
  );
  return `${rows[0].nombre}-${rows[0].derniere ?? 0}`;
}

/** Secret de signature : celui des sessions, propre à chaque installation. */
export function lireSecretSauvegarde(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("BETTER_AUTH_SECRET manquant ou trop court.");
  return secret;
}

/**
 * Lecture d'une page de lignes, chaque valeur en texte : dates en UTC telles qu'en base, booléens
 * `true`/`false`, octets en `\x...`. Noms tirés du schéma, protégés par escapeIdentifier.
 */
function requetePage(table: DescriptionTable): string {
  const colonnes = table.colonnes.map((colonne) => `${escapeIdentifier(colonne)}::text AS ${escapeIdentifier(colonne)}`).join(", ");
  return `SELECT ${colonnes} FROM ${escapeIdentifier(table.nom)} ORDER BY ${table.cle.map(escapeIdentifier).join(", ")} LIMIT $1 OFFSET $2`;
}

/** Instructions INSERT d'une table, par paquets d'au plus TAILLE_MAX_INSTRUCTION_SAUVEGARDE caractères. */
async function* instructionsTable(connexion: PoolClient, table: DescriptionTable): AsyncGenerator<string> {
  const requete = requetePage(table);
  for (let decalage = 0; ; decalage += LIGNES_PAR_LECTURE_SAUVEGARDE) {
    const { rows } = await connexion.query<Record<string, string | null>>(requete, [LIGNES_PAR_LECTURE_SAUVEGARDE, decalage]);
    let paquet: string[][] = [];
    let taille = 0;
    for (const ligne of rows) {
      const valeurs = table.colonnes.map((colonne) => valeurSql(ligne[colonne]));
      const tailleLigne = valeurs.reduce((total, valeur) => total + valeur.length + 1, 3);
      if (paquet.length > 0 && taille + tailleLigne > TAILLE_MAX_INSTRUCTION_SAUVEGARDE) {
        yield instructionInsert(table.nom, table.colonnes, paquet);
        paquet = [];
        taille = 0;
      }
      paquet.push(valeurs);
      taille += tailleLigne;
    }
    if (paquet.length > 0) yield instructionInsert(table.nom, table.colonnes, paquet);
    if (rows.length < LIGNES_PAR_LECTURE_SAUVEGARDE) return;
  }
}

/** Fichier complet, morceau par morceau, lu dans un instantané cohérent de la base ; la signature termine le fichier. */
export async function* genererSauvegarde(pool: Pool, secret: string, avecComptes: boolean): AsyncGenerator<string> {
  const signataire = creerSignataire(secret);
  const emettre = (texte: string) => {
    signataire.ajouter(texte);
    return texte;
  };
  const connexion = await pool.connect();
  try {
    // REPEATABLE READ : toutes les tables sont lues au même instant.
    await connexion.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const tables = tablesSauvegardees(avecComptes);
    const migration = await lireVersionMigrations(connexion);
    yield emettre(texteEnTete({ format: FORMAT_SAUVEGARDE, migration, avecComptes, creeLe: new Date().toISOString(), tables: tables.map((table) => table.nom) }));
    for (const table of tables) {
      yield emettre(`DELETE FROM "${table.nom}";\n`);
      for await (const instruction of instructionsTable(connexion, table)) yield emettre(`${instruction}\n`);
    }
    yield emettre(`${FIN_TRANSACTION}\n`);
    yield signataire.ligneFinale();
    await connexion.query("COMMIT");
  } catch (erreur) {
    await connexion.query("ROLLBACK").catch(() => undefined);
    throw erreur;
  } finally {
    connexion.release();
  }
}

/** Dossier des sauvegardes écrites sur le serveur (avant un import, ou par le script). Jamais dans Git. */
export const dossierSauvegardes = () => process.env.DOSSIER_SAUVEGARDES || join(process.cwd(), "sauvegardes");

/** Écrit une sauvegarde complète (comptes compris) sur le disque du serveur et renvoie son chemin. */
export async function ecrireSauvegardeSurDisque(pool: Pool, secret: string, prefixe: string, avecComptes = true, chemin?: string): Promise<string> {
  const cheminFinal = chemin ?? join(dossierSauvegardes(), nomFichierSauvegarde(prefixe, new Date()));
  if (!chemin) await mkdir(dossierSauvegardes(), { recursive: true });
  // « wx » : jamais d'écrasement d'une sauvegarde existante ; lisible par le seul compte du serveur.
  await pipeline(Readable.from(genererSauvegarde(pool, secret, avecComptes)), createWriteStream(cheminFinal, { flags: "wx", mode: 0o600 }));
  return cheminFinal;
}
