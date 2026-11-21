/**
 * Fichier de sauvegarde de PS Time : en-tête, signature HMAC et relecture complète avant import.
 * Seul un fichier produit par une installation qui a le même secret, à la même version de base,
 * est accepté. Fonctions pures, testées dans sauvegarde.test.ts.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { FORMAT_SAUVEGARDE, FUSEAU_HORAIRE } from "../constantes.ts";
import { estNomSql, lireInsertion, type Insertion } from "./sauvegarde-sql.ts";

export type EnTeteSauvegarde = {
  format: number;
  /** Version de la base : nombre de migrations appliquées et date de la dernière. */
  migration: string;
  avecComptes: boolean;
  creeLe: string;
  tables: string[];
};

export type ErreurSauvegarde = "signature" | "format" | "migration" | "tables" | "contenu";
export type SauvegardeLue = { ok: true; enTete: EnTeteSauvegarde; insertions: Insertion[] } | { ok: false; erreur: ErreurSauvegarde };

const PREFIXE_SIGNATURE = "-- signature: ";
/** Instructions fixes acceptées telles quelles (utiles si le fichier est rejoué dans phpMyAdmin). */
const INSTRUCTIONS_FIXES = new Set(["SET NAMES utf8mb4;", "SET FOREIGN_KEY_CHECKS = 0;", "SET FOREIGN_KEY_CHECKS = 1;"]);
const SUPPRESSION = /^DELETE FROM `([a-z][a-z0-9_]{0,63})`;$/;

const FORMAT_NOM_FICHIER = new Intl.DateTimeFormat("sv-SE", { timeZone: FUSEAU_HORAIRE, dateStyle: "short", timeStyle: "medium" });

/** Nom du fichier : préfixe, date et heure de Casablanca (« ps-time-sauvegarde-2026-11-21-140509.sql »). */
export function nomFichierSauvegarde(prefixe: string, date: Date): string {
  return `${prefixe}-${FORMAT_NOM_FICHIER.format(date).replace(" ", "-").replaceAll(":", "")}.sql`;
}

export function texteEnTete(enTete: EnTeteSauvegarde): string {
  return [
    "-- PS Time : sauvegarde des données. Fichier confidentiel (données personnelles).",
    `-- format: ${enTete.format}`,
    `-- migration: ${enTete.migration}`,
    `-- comptes: ${enTete.avecComptes ? "oui" : "non"}`,
    `-- cree-le: ${enTete.creeLe}`,
    `-- tables: ${enTete.tables.join(",")}`,
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS = 0;",
    "",
  ].join("\n");
}

/** Signature du contenu (tout ce qui précède la ligne de signature). */
export function signerSauvegarde(contenu: string | Buffer, secret: string): string {
  return createHmac("sha256", secret).update("ps-time-sauvegarde\n").update(contenu).digest("hex");
}

/** Signateur au fil de l'eau, pour un export écrit par morceaux. */
export function creerSignataire(secret: string) {
  const hmac = createHmac("sha256", secret).update("ps-time-sauvegarde\n");
  return { ajouter: (morceau: string) => hmac.update(morceau), ligneFinale: () => `${PREFIXE_SIGNATURE}${hmac.digest("hex")}\n` };
}

function signatureValide(texte: string, secret: string): string | null {
  const debut = texte.lastIndexOf(`\n${PREFIXE_SIGNATURE}`) + 1;
  if (debut <= 0) return null;
  const contenu = texte.slice(0, debut);
  const recue = Buffer.from(texte.slice(debut + PREFIXE_SIGNATURE.length).trim(), "utf8");
  const attendue = Buffer.from(signerSauvegarde(contenu, secret), "utf8");
  return recue.length === attendue.length && timingSafeEqual(recue, attendue) ? contenu : null;
}

function lireEnTete(lignes: readonly string[]): EnTeteSauvegarde | null {
  const champs = new Map<string, string>();
  for (const ligne of lignes) {
    const correspondance = /^-- ([a-z-]+): (.*)$/.exec(ligne);
    if (correspondance) champs.set(correspondance[1], correspondance[2]);
  }
  const format = Number(champs.get("format"));
  const migration = champs.get("migration");
  const comptes = champs.get("comptes");
  const tables = champs.get("tables")?.split(",") ?? [];
  if (!Number.isInteger(format) || !migration || (comptes !== "oui" && comptes !== "non") || !tables.every(estNomSql)) return null;
  return { format, migration, avecComptes: comptes === "oui", creeLe: champs.get("cree-le") ?? "", tables };
}

const memeEnsemble = (a: readonly string[], b: readonly string[]) => a.length === b.length && new Set([...a, ...b]).size === a.length;

function lireInstructions(lignes: readonly string[], colonnesParTable: Readonly<Record<string, readonly string[]>>): Insertion[] | null {
  const insertions: Insertion[] = [];
  for (const ligne of lignes) {
    if (ligne === "" || ligne.startsWith("-- ") || INSTRUCTIONS_FIXES.has(ligne)) continue;
    const suppression = SUPPRESSION.exec(ligne);
    if (suppression) {
      if (!(suppression[1] in colonnesParTable)) return null;
      continue;
    }
    const insertion = lireInsertion(ligne);
    const colonnesConnues = insertion ? colonnesParTable[insertion.table] : undefined;
    if (!insertion || !colonnesConnues || !insertion.colonnes.every((colonne) => colonnesConnues.includes(colonne))) return null;
    insertions.push(insertion);
  }
  return insertions;
}

/**
 * Vérifie et relit une sauvegarde. `tablesAttendues` : tables et colonnes que la base actuelle
 * sauvegarde avec et sans comptes ; le fichier doit en contenir exactement la liste.
 */
export function lireSauvegarde(
  texte: string,
  secret: string,
  migrationActuelle: string,
  tablesAttendues: { avecComptes: Record<string, readonly string[]>; sansComptes: Record<string, readonly string[]> },
): SauvegardeLue {
  const contenu = signatureValide(texte.replace(/\r\n/g, "\n"), secret);
  if (contenu === null) return { ok: false, erreur: "signature" };
  const lignes = contenu.split("\n");
  const enTete = lireEnTete(lignes.filter((ligne) => ligne.startsWith("-- ")));
  if (!enTete || enTete.format !== FORMAT_SAUVEGARDE) return { ok: false, erreur: "format" };
  if (enTete.migration !== migrationActuelle) return { ok: false, erreur: "migration" };
  const colonnesParTable = enTete.avecComptes ? tablesAttendues.avecComptes : tablesAttendues.sansComptes;
  if (!memeEnsemble(enTete.tables, Object.keys(colonnesParTable))) return { ok: false, erreur: "tables" };
  const insertions = lireInstructions(lignes, colonnesParTable);
  return insertions ? { ok: true, enTete, insertions } : { ok: false, erreur: "contenu" };
}
