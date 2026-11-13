import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Même chargement des variables que Next.js (.env.local, etc.).
loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL manquante : la renseigner dans .env.local.");
}

export default defineConfig({
  dialect: "mysql",
  schema: "./src/lib/donnees/schema.ts",
  out: "./base-de-donnees/migrations",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
