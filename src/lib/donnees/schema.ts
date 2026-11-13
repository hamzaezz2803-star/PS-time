import { sql } from "drizzle-orm";
import {
  type AnyMySqlColumn,
  boolean,
  char,
  check,
  datetime,
  index,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Schéma de la base. Toute modification passe par une migration :
 * `npm run db:generer -- --name <nom>` puis `npm run db:migrer`.
 *
 * Compatible MariaDB 10.4+ et MySQL 8.0.16+.
 * Les dates sont en UTC (la connexion force time_zone = '+00:00').
 * Les tables utilisateurs, sessions, comptes et verifications suivent le
 * modèle de Better Auth (voir src/lib/donnees/authentification.ts).
 */

// UUID() de MariaDB/MySQL est un v1 (horodaté, devinable) : l'application fournit un v4 aléatoire.
// Le défaut SQL ne sert que pour une insertion manuelle (phpMyAdmin).
const identifiantUnique = () =>
  char("id", { length: 36 })
    .primaryKey()
    .default(sql`(uuid())`)
    .$defaultFn(() => crypto.randomUUID());

const referenceUtilisateur = () =>
  char("utilisateur_id", { length: 36 })
    .notNull()
    .references(() => utilisateurs.id, { onDelete: "cascade" });

const date = (nom: string) => datetime(nom, { fsp: 3, mode: "date" });

const dateCreation = () =>
  date("cree_le").notNull().default(sql`CURRENT_TIMESTAMP(3)`);

// Drizzle n'offre « ON UPDATE » que pour TIMESTAMP (limité à 2038) : on l'écrit dans le défaut.
const dateModification = () =>
  date("modifie_le")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`);

export const utilisateurs = mysqlTable(
  "utilisateurs",
  {
    id: identifiantUnique(),
    identifiant: varchar("identifiant", { length: 50 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    emailVerifie: boolean("email_verifie").notNull().default(false),
    nom: varchar("nom", { length: 100 }).notNull(),
    // Exigée par Better Auth ; non collectée pour l'instant (reste vide).
    image: varchar("image", { length: 500 }),
    doitChangerMotDePasse: boolean("doit_changer_mot_de_passe")
      .notNull()
      .default(true),
    estActif: boolean("est_actif").notNull().default(true),
    estSuperAdmin: boolean("est_super_admin").notNull().default(false),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
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

/** Sessions de connexion. Le jeton est stocké dans un cookie httpOnly. */
export const sessions = mysqlTable(
  "sessions",
  {
    id: identifiantUnique(),
    utilisateurId: referenceUtilisateur(),
    jeton: varchar("jeton", { length: 255 }).notNull(),
    expireLe: date("expire_le").notNull(),
    // Conservés pour repérer une connexion suspecte (journal de sécurité).
    adresseIp: varchar("adresse_ip", { length: 45 }),
    agentUtilisateur: varchar("agent_utilisateur", { length: 500 }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("sessions_jeton_idx").on(table.jeton),
    index("sessions_utilisateur_idx").on(table.utilisateurId),
  ],
);

/** Moyens de connexion d'un utilisateur. Pour l'instant : mot de passe (fournisseur « credential »). */
export const comptes = mysqlTable(
  "comptes",
  {
    id: identifiantUnique(),
    utilisateurId: referenceUtilisateur(),
    fournisseurId: varchar("fournisseur_id", { length: 50 }).notNull(),
    compteId: varchar("compte_id", { length: 255 }).notNull(),
    // Empreinte scrypt calculée par Better Auth (sel inclus). Jamais de mot de passe en clair ni de MD5.
    motDePasse: varchar("mot_de_passe", { length: 255 }),
    // Colonnes exigées par Better Auth pour les connexions externes (Google, etc.) ; vides pour l'instant.
    jetonAcces: text("jeton_acces"),
    jetonRafraichissement: text("jeton_rafraichissement"),
    jetonIdentite: text("jeton_identite"),
    jetonAccesExpireLe: date("jeton_acces_expire_le"),
    jetonRafraichissementExpireLe: date("jeton_rafraichissement_expire_le"),
    portee: varchar("portee", { length: 500 }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("comptes_fournisseur_compte_idx").on(
      table.fournisseurId,
      table.compteId,
    ),
    index("comptes_utilisateur_idx").on(table.utilisateurId),
  ],
);

/** Jetons temporaires (réinitialisation de mot de passe, vérification d'e-mail). */
export const verifications = mysqlTable(
  "verifications",
  {
    id: identifiantUnique(),
    identifiant: varchar("identifiant", { length: 255 }).notNull(),
    valeur: varchar("valeur", { length: 255 }).notNull(),
    expireLe: date("expire_le").notNull(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [index("verifications_identifiant_idx").on(table.identifiant)],
);

/**
 * Départements de l'entreprise, organisés en arbre (un parent, plusieurs enfants).
 * Un département qui a des sous-départements ne peut pas être supprimé (restrict).
 */
export const departements = mysqlTable(
  "departements",
  {
    id: identifiantUnique(),
    nom: varchar("nom", { length: 100 }).notNull(),
    parentId: char("parent_id", { length: 36 }).references(
      (): AnyMySqlColumn => departements.id,
      { onDelete: "restrict" },
    ),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    // Deux sous-départements d'un même parent ne peuvent pas porter le même nom.
    // (À la racine, parent_id est NULL : l'application fait la vérification.)
    uniqueIndex("departements_parent_nom_idx").on(table.parentId, table.nom),
    index("departements_parent_idx").on(table.parentId),
    check("departements_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
    check(
      "departements_pas_son_propre_parent",
      sql`${table.parentId} IS NULL OR ${table.parentId} <> ${table.id}`,
    ),
  ],
);
