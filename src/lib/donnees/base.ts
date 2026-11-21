import "server-only";

import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export type Base = MySql2Database<typeof schema>;

// Conservé entre les rechargements à chaud du serveur de développement.
const globalPourBase = globalThis as unknown as { basePsTime?: Base; poolPsTime?: mysql.Pool };

function creerPool(): mysql.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL manquante : la renseigner dans .env.local.");
  }

  const pool = mysql.createPool({ uri: url, timezone: "Z" });
  // Les valeurs par défaut CURRENT_TIMESTAMP doivent être en UTC.
  pool.on("connection", (connexion) => {
    connexion.query("SET time_zone = '+00:00'");
  });

  return pool;
}

/** Connexions brutes : seulement pour la sauvegarde, qui lit et réécrit des tables entières. */
export function obtenirPool(): mysql.Pool {
  globalPourBase.poolPsTime ??= creerPool();
  return globalPourBase.poolPsTime;
}

/** Accès unique à la base, réservé au serveur. */
export function obtenirBase(): Base {
  globalPourBase.basePsTime ??= drizzle(obtenirPool(), { schema, mode: "default" });
  return globalPourBase.basePsTime;
}
