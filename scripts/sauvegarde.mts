/**
 * Sauvegarde en ligne de commande, sur le serveur (accès réservé à qui administre la machine).
 *
 *   npm run sauvegarde:exporter -- [--sans-comptes] [--fichier chemin.sql]
 *   npm run sauvegarde:importer -- --fichier chemin.sql --confirmer IMPORTER [--externe]
 *
 * Import : une sauvegarde PS Time signée est relue et vérifiée comme dans la page.
 * --externe exécute tel quel un fichier SQL d'une autre origine (phpMyAdmin, mysqldump) :
 * à n'utiliser qu'avec un fichier de confiance. Dans les deux cas, la base actuelle est
 * d'abord sauvegardée dans le dossier « sauvegardes ».
 */
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import nextEnv from "@next/env";
import mysql from "mysql2/promise";
import { MOT_CONFIRMATION_IMPORT } from "../src/lib/constantes.ts";
import { ecrireSauvegardeSurDisque, lireSecretSauvegarde } from "../src/lib/donnees/sauvegarde-export.ts";
import { importerSauvegarde } from "../src/lib/donnees/sauvegarde-import.ts";

const USAGE = [
  "npm run sauvegarde:exporter -- [--sans-comptes] [--fichier chemin.sql]",
  `npm run sauvegarde:importer -- --fichier chemin.sql --confirmer ${MOT_CONFIRMATION_IMPORT} [--externe]`,
].join("\n  ");

function quitter(message: string): never {
  console.error(message);
  process.exit(1);
}

function creerPool(url: string, plusieursInstructions = false): mysql.Pool {
  const pool = mysql.createPool({ uri: url, timezone: "Z", multipleStatements: plusieursInstructions, connectionLimit: 2 });
  pool.on("connection", (connexion) => connexion.query("SET time_zone = '+00:00'"));
  return pool;
}

async function exporter(pool: mysql.Pool, secret: string, avecComptes: boolean, fichier?: string) {
  const chemin = await ecrireSauvegardeSurDisque(pool, secret, "ps-time-sauvegarde", avecComptes, fichier);
  console.info(`Sauvegarde écrite : ${chemin}`);
}

async function importerExterne(url: string, texte: string) {
  // Fichier non signé : exécuté tel quel, sans transaction possible (un CREATE TABLE valide tout seul).
  const pool = creerPool(url, true);
  try {
    await pool.query(texte);
  } finally {
    await pool.end();
  }
}

async function importer(pool: mysql.Pool, url: string, secret: string, fichier: string, externe: boolean) {
  const texte = await readFile(fichier, "utf8");
  if (externe) {
    console.info(`Base actuelle sauvegardée : ${await ecrireSauvegardeSurDisque(pool, secret, "avant-import")}`);
    await importerExterne(url, texte);
    console.info("Fichier externe exécuté. Si des comptes ont changé, faites reconnecter les utilisateurs.");
    return;
  }
  const resultat = await importerSauvegarde(pool, secret, texte);
  if (!resultat.ok) quitter(`Import refusé (${resultat.erreur}). Rien n'a été changé.`);
  console.info(`Import terminé : ${resultat.lignes} lignes dans ${resultat.tables} tables. Ancienne base : ${resultat.sauvegardeAvant}`);
}

async function lancer() {
  nextEnv.loadEnvConfig(process.cwd());
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { fichier: { type: "string" }, "sans-comptes": { type: "boolean" }, confirmer: { type: "string" }, externe: { type: "boolean" } },
  });
  const commande = positionals[0];
  const url = process.env.DATABASE_URL;
  if (!url) quitter("DATABASE_URL manquante : la renseigner dans .env.local.");
  if (commande === "importer" && (!values.fichier || values.confirmer !== MOT_CONFIRMATION_IMPORT)) quitter(`Usage :\n  ${USAGE}`);
  if (commande !== "importer" && commande !== "exporter") quitter(`Usage :\n  ${USAGE}`);

  const secret = lireSecretSauvegarde();
  const pool = creerPool(url);
  try {
    if (commande === "exporter") await exporter(pool, secret, !values["sans-comptes"], values.fichier);
    else await importer(pool, url, secret, values.fichier ?? "", values.externe ?? false);
  } finally {
    await pool.end();
  }
}

lancer().catch((erreur: unknown) => {
  // Message seulement : jamais de requête SQL ni de donnée dans la sortie.
  quitter(`Échec : ${erreur instanceof Error ? erreur.message.slice(0, 300) : "erreur inconnue"}`);
});
