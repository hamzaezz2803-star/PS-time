/**
 * Convertit un export phpMyAdmin de la base (MySQL / MariaDB) en script PostgreSQL :
 * tables, contraintes CHECK, index, clés étrangères, date de modification automatique et données.
 * Ne se connecte à aucune base : lit un fichier, en écrit un autre (jamais écrasé).
 *
 *   npm run db:convertir-postgres -- --source C:\chemin\ps-time.sql [--fichier sauvegardes\ps-time-postgres.sql]
 *
 * Le script produit s'exécute dans une base PostgreSQL vide (13 ou plus), en une seule transaction.
 * Il contient des données personnelles et les empreintes des mots de passe : le garder hors de Git.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { CONTRAINTES } from "./contraintes-postgres.mts";
import { type Colonne, type Insertion, type Table, type Valeur, lireExportMysql } from "./lecture-export-mysql.mts";

// Sessions et jetons ne sont jamais repris (chacun se reconnecte) ; le suivi des migrations
// MySQL ne vaut pas pour PostgreSQL.
const TABLES_SANS_DONNEES = new Set(["sessions", "verifications"]);
const TABLES_IGNOREES = new Set(["__drizzle_migrations"]);
const LIGNES_PAR_INSERTION = 500;
const LONGUEUR_NOM_MAX = 63;

function typePostgres(type: string): string {
  if (type === "char(36)") return "uuid";
  if (type === "tinyint(1)") return "boolean";
  if (type.startsWith("int(")) return "integer";
  if (type.startsWith("bigint(")) return "bigint";
  if (type === "datetime(3)") return "timestamp(3) with time zone";
  if (type === "decimal(4,1)") return "numeric(4,1)";
  if (type === "mediumblob") return "bytea";
  if (type === "date" || type === "text" || /^varchar\(\d+\)$/.test(type)) return type;
  throw new Error(`Type MySQL non prévu : ${type}`);
}

function defautPostgres(colonne: Colonne): string | null {
  const { defaut, type } = colonne;
  if (defaut === null) return null;
  if (defaut === "uuid()") return "gen_random_uuid()";
  if (defaut.startsWith("current_timestamp")) return "CURRENT_TIMESTAMP";
  if (type === "tinyint(1)") return defaut === "0" ? "false" : "true";
  return defaut;
}

function valeurPostgres(valeur: Valeur, type: string): string {
  switch (valeur.genre) {
    case "nul":
      return "NULL";
    case "nombre":
      if (type === "tinyint(1)") return valeur.texte === "0" ? "false" : "true";
      return valeur.texte;
    case "hexa":
      return `'\\x${valeur.texte.toLowerCase()}'::bytea`;
    case "texte":
      if (valeur.texte.includes("\0")) throw new Error("Caractère nul dans un texte : refusé par PostgreSQL.");
      return `'${valeur.texte.replace(/'/g, "''")}'`;
  }
}

const verifierNom = (nom: string) => {
  if (nom.length > LONGUEUR_NOM_MAX) throw new Error(`Nom trop long pour PostgreSQL (${LONGUEUR_NOM_MAX} caractères) : ${nom}`);
  return nom;
};
const liste = (colonnes: string[]) => colonnes.join(", ");

function creerTable(table: Table): string {
  const lignes = table.colonnes.map((colonne) => {
    const defaut = defautPostgres(colonne);
    return `  ${colonne.nom} ${typePostgres(colonne.type)}${colonne.estNonNul ? " NOT NULL" : ""}${defaut ? ` DEFAULT ${defaut}` : ""}`;
  });
  if (table.clePrimaire.length) lignes.push(`  CONSTRAINT ${verifierNom(`${table.nom}_pkey`)} PRIMARY KEY (${liste(table.clePrimaire)})`);
  for (const [nom, expression] of CONTRAINTES[table.nom] ?? []) lignes.push(`  CONSTRAINT ${verifierNom(nom)} CHECK (${expression})`);
  return `CREATE TABLE ${table.nom} (\n${lignes.join(",\n")}\n);`;
}

function insererDonnees(insertion: Insertion, table: Table): string[] {
  const types = insertion.colonnes.map((nom) => {
    const colonne = table.colonnes.find((candidate) => candidate.nom === nom);
    if (!colonne) throw new Error(`Colonne inconnue ${table.nom}.${nom} dans les données.`);
    return colonne.type;
  });
  const instructions: string[] = [];
  for (let debut = 0; debut < insertion.lignes.length; debut += LIGNES_PAR_INSERTION) {
    const lignes = insertion.lignes
      .slice(debut, debut + LIGNES_PAR_INSERTION)
      .map((ligne) => `(${ligne.map((valeur, position) => valeurPostgres(valeur, types[position])).join(", ")})`);
    instructions.push(`INSERT INTO ${table.nom} (${liste(insertion.colonnes)}) VALUES\n${lignes.join(",\n")};`);
  }
  return instructions;
}

function indexEtCles(tables: Table[]): { index: string[]; cles: string[]; declencheurs: string[] } {
  const index = tables.flatMap((table) =>
    table.index.map((ligne) => `CREATE ${ligne.estUnique ? "UNIQUE " : ""}INDEX ${verifierNom(ligne.nom)} ON ${table.nom} (${liste(ligne.colonnes)});`),
  );
  const cles = tables.flatMap((table) =>
    table.clesEtrangeres.map(
      (cle) =>
        `ALTER TABLE ${table.nom} ADD CONSTRAINT ${verifierNom(cle.nom)} FOREIGN KEY (${liste(cle.colonnes)}) REFERENCES ${cle.tableReferencee} (${liste(cle.colonnesReferencees)}) ON DELETE ${cle.surSuppression};`,
    ),
  );
  const declencheurs = tables
    .filter((table) => table.aDateModificationAuto)
    .map((table) => `CREATE TRIGGER ${verifierNom(`${table.nom}_modifie_le`)} BEFORE UPDATE ON ${table.nom} FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();`);
  return { index, cles, declencheurs };
}

const FONCTION_DATE_MODIFICATION = `-- Remplace « ON UPDATE CURRENT_TIMESTAMP » de MySQL.
CREATE FUNCTION public.maj_modifie_le() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.modifie_le = now();
  RETURN NEW;
END;
$$;`;

function convertir(cheminSource: string): { sql: string; resume: string[] } {
  const { tables, insertions } = lireExportMysql(readFileSync(cheminSource, "utf8"));
  const tablesGardees = [...tables.values()].filter((table) => !TABLES_IGNOREES.has(table.nom));
  for (const nom of Object.keys(CONTRAINTES)) {
    if (!tables.has(nom)) throw new Error(`Table ${nom} absente de l'export : export incomplet ou d'une autre version.`);
  }
  const resume: string[] = [];
  const donnees = insertions.flatMap((insertion) => {
    const table = tables.get(insertion.table);
    if (!table) throw new Error(`Données d'une table inconnue : ${insertion.table}`);
    if (TABLES_IGNOREES.has(table.nom) || TABLES_SANS_DONNEES.has(table.nom)) {
      resume.push(`${table.nom} : ${insertion.lignes.length} ligne(s) non reprise(s)`);
      return [];
    }
    resume.push(`${table.nom} : ${insertion.lignes.length} ligne(s)`);
    return insererDonnees(insertion, table);
  });
  const { index, cles, declencheurs } = indexEtCles(tablesGardees);
  const sql = [
    `-- ps-time : base PostgreSQL convertie depuis « ${basename(cheminSource)} » par scripts/mysql-vers-postgres.mts, le ${new Date().toISOString()}.`,
    "-- À exécuter dans une base PostgreSQL VIDE. Une seule transaction : en cas d'erreur, rien n'est gardé.",
    "-- Sessions et jetons temporaires non repris : chaque utilisateur se reconnecte.",
    "-- Données personnelles et empreintes des mots de passe : à garder dans un endroit sûr, jamais dans Git.",
    "BEGIN;",
    "SET LOCAL timezone = 'UTC';",
    "SET LOCAL standard_conforming_strings = on;",
    FONCTION_DATE_MODIFICATION,
    "-- Tables",
    ...tablesGardees.map(creerTable),
    "-- Données (avant les clés étrangères : l'ordre des tables n'a pas d'importance)",
    ...donnees,
    "-- Index",
    ...index,
    "-- Clés étrangères",
    ...cles,
    "-- Date de modification automatique",
    ...declencheurs,
    "COMMIT;",
  ].join("\n\n");
  return { sql: `${sql}\n`, resume };
}

const { values: options } = parseArgs({ options: { source: { type: "string" }, fichier: { type: "string" } } });
if (!options.source) {
  console.error("Usage : npm run db:convertir-postgres -- --source chemin\\ps-time.sql [--fichier sortie.sql]");
  process.exit(1);
}
const cheminSortie = resolve(options.fichier ?? "sauvegardes/ps-time-postgres.sql");
const { sql, resume } = convertir(resolve(options.source));
mkdirSync(dirname(cheminSortie), { recursive: true });
// « wx » : un fichier existant n'est jamais écrasé.
writeFileSync(cheminSortie, sql, { encoding: "utf8", flag: "wx" });
console.log(`Script PostgreSQL écrit : ${cheminSortie}\n${resume.map((ligne) => `  - ${ligne}`).join("\n")}`);
