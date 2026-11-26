import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Même chargement des variables que Next.js (.env.local, etc.).
loadEnvConfig(process.cwd());

// Les migrations passent par le compte propriétaire des tables ; l'application, jamais.
const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL_MIGRATIONS manquante : la renseigner dans .env.local.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/donnees/schema.ts",
  out: "./base-de-donnees/migrations",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
