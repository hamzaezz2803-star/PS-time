import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  datetime,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Schéma de la base. Toute modification passe par une migration :
 * `npm run db:generer` puis `npm run db:migrer`.
 *
 * Compatible MariaDB 10.4+ et MySQL 8.0.16+.
 * Les dates sont en UTC (la connexion force time_zone = '+00:00').
 */

const dateCreation = (nom: string) =>
  datetime(nom, { fsp: 3, mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`);

export const utilisateurs = mysqlTable(
  "utilisateurs",
  {
    // UUID() de MariaDB/MySQL est un v1 (horodaté, devinable) : l'application fournit un v4 aléatoire.
    // Le défaut SQL ne sert que pour une insertion manuelle (phpMyAdmin).
    id: char("id", { length: 36 })
      .primaryKey()
      .default(sql`(uuid())`)
      .$defaultFn(() => crypto.randomUUID()),
    identifiant: varchar("identifiant", { length: 50 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    nom: varchar("nom", { length: 100 }).notNull(),
    // Empreinte argon2id ou bcrypt (sel inclus). Jamais de mot de passe en clair ni de MD5.
    motDePasseHash: varchar("mot_de_passe_hash", { length: 255 }).notNull(),
    doitChangerMotDePasse: boolean("doit_changer_mot_de_passe")
      .notNull()
      .default(true),
    motDePasseModifieLe: dateCreation("mot_de_passe_modifie_le"),
    estActif: boolean("est_actif").notNull().default(true),
    estSuperAdmin: boolean("est_super_admin").notNull().default(false),
    creeLe: dateCreation("cree_le"),
    // Drizzle n'offre « ON UPDATE » que pour TIMESTAMP (limité à 2038) : on l'écrit dans le défaut.
    modifieLe: datetime("modifie_le", { fsp: 3, mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    uniqueIndex("utilisateurs_identifiant_idx").on(table.identifiant),
    uniqueIndex("utilisateurs_email_idx").on(table.email),
    // Comparaison binaire : la collation par défaut ignore la casse.
    check(
      "utilisateurs_email_minuscules",
      sql`CAST(${table.email} AS BINARY) = CAST(LOWER(${table.email}) AS BINARY)`,
    ),
    check(
      "utilisateurs_identifiant_minuscules",
      sql`CAST(${table.identifiant} AS BINARY) = CAST(LOWER(${table.identifiant}) AS BINARY)`,
    ),
    check("utilisateurs_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
  ],
);
