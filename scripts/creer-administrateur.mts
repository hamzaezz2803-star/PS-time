/**
 * Crée le premier compte super administrateur d'une installation.
 *
 *   npm run admin:creer -- --identifiant admin --email admin@client.ma --nom "Nom Prénom"
 *
 * Un mot de passe temporaire aléatoire est affiché une seule fois ;
 * il devra être changé à la première connexion.
 */
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import nextEnv from "@next/env";
import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { z } from "zod";
import { comptes, utilisateurs } from "../src/lib/donnees/schema.ts";

const OCTETS_MOT_DE_PASSE_TEMPORAIRE = 12;
const FOURNISSEUR_MOT_DE_PASSE = "credential"; // nom imposé par Better Auth

const schemaArguments = z.object({
  identifiant: z.string().trim().toLowerCase().min(1).max(50),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  nom: z.string().trim().min(1).max(100),
});

function lireArguments() {
  const { values } = parseArgs({
    options: {
      identifiant: { type: "string" },
      email: { type: "string" },
      nom: { type: "string" },
    },
  });
  const analyse = schemaArguments.safeParse(values);
  if (!analyse.success) {
    console.error(
      'Usage : npm run admin:creer -- --identifiant admin --email admin@client.ma --nom "Nom Prénom"',
    );
    process.exit(1);
  }
  return analyse.data;
}

async function creerAdministrateur() {
  nextEnv.loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante : la renseigner dans .env.local.");

  const { identifiant, email, nom } = lireArguments();
  const motDePasseTemporaire = randomBytes(OCTETS_MOT_DE_PASSE_TEMPORAIRE).toString(
    "base64url",
  );
  const empreinte = await hashPassword(motDePasseTemporaire);

  const pool = mysql.createPool({ uri: url, timezone: "Z" });
  pool.on("connection", (connexion) => connexion.query("SET time_zone = '+00:00'"));
  const base = drizzle(pool, { mode: "default" });
  const id = crypto.randomUUID();

  try {
    await base.transaction(async (transaction) => {
      await transaction.insert(utilisateurs).values({
        id,
        identifiant,
        email,
        nom,
        estSuperAdmin: true,
        doitChangerMotDePasse: true,
      });
      await transaction.insert(comptes).values({
        utilisateurId: id,
        fournisseurId: FOURNISSEUR_MOT_DE_PASSE,
        compteId: id,
        motDePasse: empreinte,
      });
    });
  } catch (erreur) {
    const code = (erreur as { cause?: { code?: string } }).cause?.code;
    console.error(
      code === "ER_DUP_ENTRY"
        ? "Un utilisateur avec cet identifiant ou cet e-mail existe déjà."
        : "La création a échoué. Vérifiez que la base est joignable et migrée (npm run db:migrer).",
    );
    process.exitCode = 1;
    return;
  } finally {
    await pool.end();
  }

  console.info(`Super administrateur « ${identifiant} » créé.`);
  console.info(`Mot de passe temporaire (affiché une seule fois) : ${motDePasseTemporaire}`);
  console.info("Il devra être changé à la première connexion.");
}

await creerAdministrateur();
