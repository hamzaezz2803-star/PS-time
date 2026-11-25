import "server-only";

import { escapeIdentifier, type Pool, type PoolClient } from "pg";
import { PARAMETRES_MAX_PAR_REQUETE, TABLES_COMPTES } from "../constantes.ts";
import { lireSauvegarde, type ErreurSauvegarde } from "../metier/sauvegarde.ts";
import type { Insertion, ValeurSql } from "../metier/sauvegarde-sql.ts";
import { colonnesParTable, ecrireSauvegardeSurDisque, lireVersionMigrations } from "./sauvegarde-export.ts";

/**
 * Import d'une sauvegarde produite par l'application. Le fichier n'est jamais exécuté :
 * il est relu comme des données (lireSauvegarde), puis réécrit par des requêtes paramétrées,
 * dans une seule transaction, après une sauvegarde automatique de la base actuelle.
 */

export type ErreurImport = ErreurSauvegarde | "sauvegarde_avant" | "incoherent" | "sans_super_admin";
export type ResultatImport =
  | { ok: true; avecComptes: boolean; tables: number; lignes: number; sauvegardeAvant: string }
  | { ok: false; erreur: ErreurImport };

/** Levée dans la transaction pour l'annuler avec une raison connue. */
class RefusImport extends Error {
  readonly raison: ErreurImport;
  constructor(raison: ErreurImport) {
    super(raison);
    this.raison = raison;
  }
}

const CODE_CLE_ETRANGERE = "23503";
const nom = escapeIdentifier;

type CleEtrangere = { table: string; colonne: string; table_cible: string; colonne_cible: string };

/** Clés étrangères du schéma public (toutes sur une seule colonne). */
async function lireClesEtrangeres(connexion: PoolClient): Promise<CleEtrangere[]> {
  const { rows } = await connexion.query<CleEtrangere>(
    `SELECT e.relname AS table, ae.attname AS colonne, c.relname AS table_cible, ac.attname AS colonne_cible
     FROM pg_constraint k
     JOIN pg_class e ON e.oid = k.conrelid
     JOIN pg_class c ON c.oid = k.confrelid
     JOIN pg_attribute ae ON ae.attrelid = k.conrelid AND ae.attnum = k.conkey[1]
     JOIN pg_attribute ac ON ac.attrelid = k.confrelid AND ac.attnum = k.confkey[1]
     WHERE k.contype = 'f' AND k.connamespace = 'public'::regnamespace`,
  );
  return rows;
}

/** Condition « la clé pointe vers une ligne absente » sur la table `e`. */
const sansCible = (cle: CleEtrangere) =>
  `e.${nom(cle.colonne)} IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ${nom(cle.table_cible)} c WHERE c.${nom(cle.colonne_cible)} = e.${nom(cle.colonne)})`;

/**
 * Sans comptes dans le fichier, les comptes actuels sont gardés : un auteur inconnu d'ici devient vide
 * (comme à la suppression d'un compte). Puis aucune clé étrangère ne doit pointer dans le vide.
 */
async function verifierCoherence(connexion: PoolClient, avecComptes: boolean): Promise<void> {
  const cles = await lireClesEtrangeres(connexion);
  if (!avecComptes) {
    for (const cle of cles.filter((cle) => cle.table_cible === "utilisateurs" && !(TABLES_COMPTES as readonly string[]).includes(cle.table))) {
      await connexion.query(`UPDATE ${nom(cle.table)} e SET ${nom(cle.colonne)} = NULL WHERE ${sansCible(cle)}`);
    }
  }
  for (const cle of cles) {
    const { rows } = await connexion.query<{ nombre: number }>(`SELECT count(*)::int AS nombre FROM ${nom(cle.table)} e WHERE ${sansCible(cle)}`);
    if (rows[0].nombre > 0) throw new RefusImport("incoherent");
  }
  const { rows } = await connexion.query<{ nombre: number }>("SELECT count(*)::int AS nombre FROM utilisateurs WHERE est_super_admin AND est_actif");
  if (rows[0].nombre === 0) throw new RefusImport("sans_super_admin");
}

/** Insère des lignes par paquets ($1, $2, ...) : les valeurs ne sont jamais écrites dans la requête. */
async function inserer(connexion: PoolClient, { table, colonnes, lignes }: Insertion): Promise<void> {
  const lignesParRequete = Math.max(1, Math.floor(PARAMETRES_MAX_PAR_REQUETE / colonnes.length));
  for (let debut = 0; debut < lignes.length; debut += lignesParRequete) {
    const paquet = lignes.slice(debut, debut + lignesParRequete);
    const marqueurs = paquet.map((_, rang) => `(${colonnes.map((__, position) => `$${rang * colonnes.length + position + 1}`).join(",")})`);
    const valeurs: ValeurSql[] = paquet.flat();
    await connexion.query(`INSERT INTO ${nom(table)} (${colonnes.map(nom).join(",")}) VALUES ${marqueurs.join(",")}`, valeurs);
  }
}

async function remplacerDonnees(connexion: PoolClient, tables: readonly string[], insertions: readonly Insertion[], avecComptes: boolean): Promise<void> {
  // Clés étrangères vérifiées à la fin de la transaction : l'ordre des tables est libre.
  await connexion.query("SET CONSTRAINTS ALL DEFERRED");
  for (const table of tables) await connexion.query(`DELETE FROM ${nom(table)}`);
  for (const insertion of insertions) await inserer(connexion, insertion);
  // Comptes remplacés : toutes les sessions et tous les jetons sont fermés, chacun se reconnecte.
  if (avecComptes) {
    await connexion.query("DELETE FROM sessions");
    await connexion.query("DELETE FROM verifications");
  }
  await verifierCoherence(connexion, avecComptes);
}

export async function importerSauvegarde(pool: Pool, secret: string, texte: string): Promise<ResultatImport> {
  const tablesAttendues = { avecComptes: colonnesParTable(true), sansComptes: colonnesParTable(false) };
  const lu = lireSauvegarde(texte, secret, await lireVersionMigrations(pool), tablesAttendues);
  if (!lu.ok) return lu;

  let sauvegardeAvant: string;
  try {
    sauvegardeAvant = await ecrireSauvegardeSurDisque(pool, secret, "avant-import");
  } catch (erreur) {
    console.error("Échec de la sauvegarde automatique avant import", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { ok: false, erreur: "sauvegarde_avant" };
  }

  const connexion = await pool.connect();
  try {
    await connexion.query("BEGIN");
    await remplacerDonnees(connexion, lu.enTete.tables, lu.insertions, lu.enTete.avecComptes);
    await connexion.query("COMMIT");
  } catch (erreur) {
    await connexion.query("ROLLBACK").catch(() => undefined);
    if (erreur instanceof RefusImport) return { ok: false, erreur: erreur.raison };
    // Clé étrangère refusée au COMMIT : même réponse que la vérification de cohérence.
    if ((erreur as { code?: string }).code === CODE_CLE_ETRANGERE) return { ok: false, erreur: "incoherent" };
    throw erreur;
  } finally {
    connexion.release();
  }
  const lignes = lu.insertions.reduce((total, insertion) => total + insertion.lignes.length, 0);
  return { ok: true, avecComptes: lu.enTete.avecComptes, tables: lu.enTete.tables.length, lignes, sauvegardeAvant };
}
