import "server-only";

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { is } from "drizzle-orm";
import { MySqlTable, getTableConfig } from "drizzle-orm/mysql-core";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import {
  FORMAT_SAUVEGARDE,
  LIGNES_PAR_LECTURE_SAUVEGARDE,
  TABLES_COMPTES,
  TABLES_JAMAIS_SAUVEGARDEES,
  TAILLE_MAX_INSTRUCTION_SAUVEGARDE,
} from "../constantes.ts";
import { creerSignataire, nomFichierSauvegarde, texteEnTete } from "../metier/sauvegarde.ts";
import { instructionInsert, valeurSql } from "../metier/sauvegarde-sql.ts";
import * as schema from "./schema.ts";

/**
 * Export de toutes les données en un fichier SQL signé, écrit au fil de l'eau.
 * Sans alias `@/` : aussi utilisé par le script en ligne de commande (scripts/sauvegarde.mts).
 */

type DescriptionTable = { nom: string; colonnes: string[]; cle: string[] };

const estDans = (liste: readonly string[], nom: string) => liste.includes(nom);

/** Tables du schéma Drizzle (une nouvelle table est sauvegardée sans rien changer ici), sauf sessions et jetons. */
const TABLES: DescriptionTable[] = Object.values(schema)
  .filter((valeur): valeur is MySqlTable => is(valeur, MySqlTable))
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
export async function lireVersionMigrations(connexion: Pool | PoolConnection): Promise<string> {
  const [lignes] = await connexion.query<RowDataPacket[]>("SELECT COUNT(*) AS nombre, MAX(created_at) AS derniere FROM `__drizzle_migrations`");
  return `${lignes[0].nombre}-${lignes[0].derniere ?? 0}`;
}

/** Secret de signature : celui des sessions, propre à chaque installation. */
export function lireSecretSauvegarde(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("BETTER_AUTH_SECRET manquant ou trop court.");
  return secret;
}

/** Instructions INSERT d'une table, par paquets d'au plus TAILLE_MAX_INSTRUCTION_SAUVEGARDE caractères. */
async function* instructionsTable(connexion: PoolConnection, table: DescriptionTable): AsyncGenerator<string> {
  for (let decalage = 0; ; decalage += LIGNES_PAR_LECTURE_SAUVEGARDE) {
    const [lignes] = await connexion.query<RowDataPacket[]>({
      sql: "SELECT ?? FROM ?? ORDER BY ?? LIMIT ? OFFSET ?",
      values: [table.colonnes, table.nom, table.cle, LIGNES_PAR_LECTURE_SAUVEGARDE, decalage],
      // Dates gardées telles qu'en base (UTC), sans conversion par le pilote.
      dateStrings: true,
    });
    let paquet: string[][] = [];
    let taille = 0;
    for (const ligne of lignes) {
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
    if (lignes.length < LIGNES_PAR_LECTURE_SAUVEGARDE) return;
  }
}

/** Fichier complet, morceau par morceau, lu dans un instantané cohérent de la base ; la signature termine le fichier. */
export async function* genererSauvegarde(pool: Pool, secret: string, avecComptes: boolean): AsyncGenerator<string> {
  const signataire = creerSignataire(secret);
  const emettre = (texte: string) => {
    signataire.ajouter(texte);
    return texte;
  };
  const connexion = await pool.getConnection();
  try {
    await connexion.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const tables = tablesSauvegardees(avecComptes);
    const migration = await lireVersionMigrations(connexion);
    yield emettre(texteEnTete({ format: FORMAT_SAUVEGARDE, migration, avecComptes, creeLe: new Date().toISOString(), tables: tables.map((table) => table.nom) }));
    for (const table of tables) {
      yield emettre(`DELETE FROM \`${table.nom}\`;\n`);
      for await (const instruction of instructionsTable(connexion, table)) yield emettre(`${instruction}\n`);
    }
    yield emettre("SET FOREIGN_KEY_CHECKS = 1;\n");
    yield signataire.ligneFinale();
    await connexion.query("COMMIT");
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
