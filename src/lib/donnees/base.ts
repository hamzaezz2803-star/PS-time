import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Base = NodePgDatabase<typeof schema>;

// Conservé entre les rechargements à chaud du serveur de développement.
const globalPourBase = globalThis as unknown as { basePsTime?: Base; poolPsTime?: Pool };

export function creerPool(url: string | undefined, maximumConnexions?: number): Pool {
  if (!url) {
    throw new Error("DATABASE_URL manquante : la renseigner dans .env.local.");
  }
  // Session en UTC : les dates sont stockées et comparées en UTC (affichage à Casablanca).
  return new Pool({ connectionString: url, options: "-c timezone=UTC", max: maximumConnexions });
}

/** Connexions brutes : seulement pour la sauvegarde, qui lit et réécrit des tables entières. */
export function obtenirPool(): Pool {
  // Facultatif : connexions simultanées (10 par défaut), à régler selon le serveur de base.
  const maximum = Number(process.env.DATABASE_MAX_CONNEXIONS) || undefined;
  globalPourBase.poolPsTime ??= creerPool(process.env.DATABASE_URL, maximum);
  return globalPourBase.poolPsTime;
}

/** Accès unique à la base, réservé au serveur. */
export function obtenirBase(): Base {
  globalPourBase.basePsTime ??= drizzle(obtenirPool(), { schema });
  return globalPourBase.basePsTime;
}
