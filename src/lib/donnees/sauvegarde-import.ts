import "server-only";

import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { TABLES_COMPTES } from "../constantes.ts";
import { lireSauvegarde, type ErreurSauvegarde } from "../metier/sauvegarde.ts";
import type { Insertion } from "../metier/sauvegarde-sql.ts";
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

type CleEtrangere = { table: string; colonne: string; tableCible: string; colonneCible: string };

async function lireClesEtrangeres(connexion: PoolConnection): Promise<CleEtrangere[]> {
  const [lignes] = await connexion.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS \`table\`, COLUMN_NAME AS colonne, REFERENCED_TABLE_NAME AS tableCible, REFERENCED_COLUMN_NAME AS colonneCible
     FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`,
  );
  return lignes as CleEtrangere[];
}

/** Lignes dont la clé étrangère pointe vers une ligne absente (jointure gauche sans correspondance). */
const JOINTURE = "?? AS e LEFT JOIN ?? AS c ON e.?? = c.??";
const SANS_CIBLE = "e.?? IS NOT NULL AND c.?? IS NULL";
const valeursJointure = (cle: CleEtrangere) => [cle.table, cle.tableCible, cle.colonne, cle.colonneCible];
const valeursSansCible = (cle: CleEtrangere) => [cle.colonne, cle.colonneCible];

/**
 * Sans comptes dans le fichier, les comptes actuels sont gardés : un auteur inconnu d'ici devient vide
 * (comme à la suppression d'un compte). Puis aucune clé étrangère ne doit pointer dans le vide.
 */
async function verifierCoherence(connexion: PoolConnection, avecComptes: boolean): Promise<void> {
  const cles = await lireClesEtrangeres(connexion);
  if (!avecComptes) {
    for (const cle of cles.filter((cle) => cle.tableCible === "utilisateurs" && !(TABLES_COMPTES as readonly string[]).includes(cle.table))) {
      await connexion.query(`UPDATE ${JOINTURE} SET e.?? = NULL WHERE ${SANS_CIBLE}`, [...valeursJointure(cle), cle.colonne, ...valeursSansCible(cle)]);
    }
  }
  for (const cle of cles) {
    const [lignes] = await connexion.query<RowDataPacket[]>(`SELECT COUNT(*) AS nombre FROM ${JOINTURE} WHERE ${SANS_CIBLE}`, [...valeursJointure(cle), ...valeursSansCible(cle)]);
    if (Number(lignes[0].nombre) > 0) throw new RefusImport("incoherent");
  }
  const [admins] = await connexion.query<RowDataPacket[]>("SELECT COUNT(*) AS nombre FROM `utilisateurs` WHERE `est_super_admin` = 1 AND `est_actif` = 1");
  if (Number(admins[0].nombre) === 0) throw new RefusImport("sans_super_admin");
}

async function remplacerDonnees(connexion: PoolConnection, tables: readonly string[], insertions: readonly Insertion[], avecComptes: boolean): Promise<void> {
  for (const table of tables) await connexion.query("DELETE FROM ??", [table]);
  for (const { table, colonnes, lignes } of insertions) await connexion.query("INSERT INTO ?? (??) VALUES ?", [table, colonnes, lignes]);
  // Comptes remplacés : toutes les sessions et tous les jetons sont fermés, chacun se reconnecte.
  if (avecComptes) {
    await connexion.query("DELETE FROM `sessions`");
    await connexion.query("DELETE FROM `verifications`");
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

  const connexion = await pool.getConnection();
  try {
    // Contrôle des clés coupé le temps du remplacement (ordre des tables libre), revérifié par verifierCoherence.
    await connexion.query("SET FOREIGN_KEY_CHECKS = 0");
    await connexion.beginTransaction();
    await remplacerDonnees(connexion, lu.enTete.tables, lu.insertions, lu.enTete.avecComptes);
    await connexion.commit();
  } catch (erreur) {
    await connexion.rollback();
    if (erreur instanceof RefusImport) return { ok: false, erreur: erreur.raison };
    throw erreur;
  } finally {
    await connexion.query("SET FOREIGN_KEY_CHECKS = 1");
    connexion.release();
  }
  const lignes = lu.insertions.reduce((total, insertion) => total + insertion.lignes.length, 0);
  return { ok: true, avecComptes: lu.enTete.avecComptes, tables: lu.enTete.tables.length, lignes, sauvegardeAvant };
}
