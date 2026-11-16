import { sql } from "drizzle-orm";
import {
  type AnyMySqlColumn,
  boolean,
  char,
  check,
  customType,
  date as dateCalendrier,
  datetime,
  index,
  int,
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
 * Sites (entreprises ou établissements gérés par l'installation). Un département, un poste
 * ou un employé peut être rattaché à un site ; un site encore utilisé ne peut pas être supprimé.
 */
export const sites = mysqlTable(
  "sites",
  {
    id: identifiantUnique(),
    nom: varchar("nom", { length: 100 }).notNull(),
    adresse: varchar("adresse", { length: 255 }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("sites_nom_idx").on(table.nom),
    check("sites_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
  ],
);

/** Site facultatif d'un département, d'un poste ou d'un employé. */
const referenceSite = () =>
  char("site_id", { length: 36 }).references(() => sites.id, { onDelete: "restrict" });

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
    siteId: referenceSite(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    // Deux sous-départements d'un même parent ne peuvent pas porter le même nom.
    // (À la racine, parent_id est NULL : l'application fait la vérification.)
    uniqueIndex("departements_parent_nom_idx").on(table.parentId, table.nom),
    index("departements_parent_idx").on(table.parentId),
    index("departements_site_idx").on(table.siteId),
    check("departements_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
    check(
      "departements_pas_son_propre_parent",
      sql`${table.parentId} IS NULL OR ${table.parentId} <> ${table.id}`,
    ),
  ],
);

/**
 * Postes (fonctions) de l'entreprise, organisés en arbre comme les départements.
 * Le numéro est unique ; « ordre » règle l'ordre d'affichage (plus petit en premier).
 */
export const postes = mysqlTable(
  "postes",
  {
    id: identifiantUnique(),
    code: varchar("code", { length: 30 }).notNull(),
    nom: varchar("nom", { length: 100 }).notNull(),
    ordre: int("ordre").notNull().default(99999),
    parentId: char("parent_id", { length: 36 }).references(
      (): AnyMySqlColumn => postes.id,
      { onDelete: "restrict" },
    ),
    siteId: referenceSite(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("postes_code_idx").on(table.code),
    uniqueIndex("postes_parent_nom_idx").on(table.parentId, table.nom),
    index("postes_parent_idx").on(table.parentId),
    index("postes_site_idx").on(table.siteId),
    check("postes_code_non_vide", sql`CHAR_LENGTH(TRIM(${table.code})) > 0`),
    check("postes_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
    check("postes_ordre_borne", sql`${table.ordre} BETWEEN 0 AND 99999`),
    check(
      "postes_pas_son_propre_parent",
      sql`${table.parentId} IS NULL OR ${table.parentId} <> ${table.id}`,
    ),
  ],
);

// Jour du calendrier sans heure (embauche, fin de contrat) : pas de fuseau à gérer.
const jour = (nom: string) => dateCalendrier(nom, { mode: "string" });

/**
 * Employés (personnes pointées). Seules les informations utiles au pointage sont
 * collectées : pas de date de naissance, de CIN ni de genre (minimisation).
 */
export const employes = mysqlTable(
  "employes",
  {
    id: identifiantUnique(),
    matricule: varchar("matricule", { length: 30 }).notNull(),
    numeroBadge: varchar("numero_badge", { length: 30 }).notNull(),
    prenom: varchar("prenom", { length: 100 }).notNull(),
    nom: varchar("nom", { length: 100 }).notNull(),
    departementId: char("departement_id", { length: 36 })
      .notNull()
      .references(() => departements.id, { onDelete: "restrict" }),
    posteId: char("poste_id", { length: 36 }).references(() => postes.id, {
      onDelete: "set null",
    }),
    groupeId: char("groupe_id", { length: 36 }).references((): AnyMySqlColumn => groupes.id, {
      onDelete: "set null",
    }),
    siteId: referenceSite(),
    // Format international E.164 (+212612345678).
    telephone: varchar("telephone", { length: 16 }),
    email: varchar("email", { length: 254 }),
    genre: varchar("genre", { length: 10 }),
    // Pièce d'identité : facultative, pour la déclaration CNSS. Jamais dans les journaux.
    typePieceIdentite: varchar("type_piece_identite", { length: 20 }),
    numeroPieceIdentite: varchar("numero_piece_identite", { length: 30 }),
    typeEmploi: varchar("type_emploi", { length: 20 }),
    dateEmbauche: jour("date_embauche"),
    dateDebutEmploi: jour("date_debut_emploi"),
    dateFinEmploi: jour("date_fin_emploi"),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("employes_matricule_idx").on(table.matricule),
    uniqueIndex("employes_numero_badge_idx").on(table.numeroBadge),
    uniqueIndex("employes_piece_identite_idx").on(table.typePieceIdentite, table.numeroPieceIdentite),
    // Plusieurs NULL sont permis par un index unique MySQL : l'e-mail reste facultatif.
    uniqueIndex("employes_email_idx").on(table.email),
    index("employes_departement_idx").on(table.departementId),
    index("employes_poste_idx").on(table.posteId),
    index("employes_groupe_idx").on(table.groupeId),
    index("employes_site_idx").on(table.siteId),
    index("employes_nom_idx").on(table.nom, table.prenom),
    check("employes_matricule_non_vide", sql`CHAR_LENGTH(TRIM(${table.matricule})) > 0`),
    check("employes_prenom_non_vide", sql`CHAR_LENGTH(TRIM(${table.prenom})) > 0`),
    check("employes_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
    check("employes_numero_badge_non_vide", sql`CHAR_LENGTH(TRIM(${table.numeroBadge})) > 0`),
    check("employes_genre_valide", sql`${table.genre} IS NULL OR ${table.genre} IN ('homme', 'femme')`),
    check(
      "employes_type_piece_valide",
      sql`${table.typePieceIdentite} IS NULL OR ${table.typePieceIdentite} IN ('cin', 'passeport', 'carte_sejour')`,
    ),
    // Le type et le numéro de pièce vont ensemble : tous deux renseignés ou tous deux vides.
    check(
      "employes_piece_complete",
      sql`(${table.typePieceIdentite} IS NULL) = (${table.numeroPieceIdentite} IS NULL)`,
    ),
    check(
      "employes_email_minuscules",
      sql`${table.email} IS NULL OR CAST(${table.email} AS BINARY) = CAST(LOWER(${table.email}) AS BINARY)`,
    ),
    check(
      "employes_telephone_e164",
      sql`${table.telephone} IS NULL OR ${table.telephone} REGEXP '^[+][1-9][0-9]{7,14}$'`,
    ),
    check(
      "employes_type_emploi_valide",
      sql`${table.typeEmploi} IS NULL OR ${table.typeEmploi} IN ('cdi', 'cdd', 'interim', 'stage')`,
    ),
    check(
      "employes_dates_emploi_coherentes",
      sql`${table.dateFinEmploi} IS NULL OR ${table.dateEmbauche} IS NULL OR ${table.dateFinEmploi} >= ${table.dateEmbauche}`,
    ),
    check(
      "employes_debut_avant_fin",
      sql`${table.dateFinEmploi} IS NULL OR ${table.dateDebutEmploi} IS NULL OR ${table.dateFinEmploi} >= ${table.dateDebutEmploi}`,
    ),
  ],
);


/**
 * Informations supplémentaires propres à un employé (ex. « Taille de blouse : M »),
 * saisies à sa création. Supprimées avec l'employé.
 */
export const informationsEmployes = mysqlTable(
  "informations_employes",
  {
    id: identifiantUnique(),
    employeId: char("employe_id", { length: 36 })
      .notNull()
      .references(() => employes.id, { onDelete: "cascade" }),
    libelle: varchar("libelle", { length: 60 }).notNull(),
    valeur: varchar("valeur", { length: 255 }).notNull(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("informations_employes_employe_libelle_idx").on(table.employeId, table.libelle),
    check("informations_employes_libelle_non_vide", sql`CHAR_LENGTH(TRIM(${table.libelle})) > 0`),
    check("informations_employes_valeur_non_vide", sql`CHAR_LENGTH(TRIM(${table.valeur})) > 0`),
  ],
);

// Drizzle n'a pas de type BLOB pour MySQL : MEDIUMBLOB (16 Mo au plus) lu et écrit en Buffer.
const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "mediumblob",
});

/**
 * Photo de profil d'un employé (facultative, une au plus), gardée en base : sauvegardée
 * avec elle et jamais servie publiquement. Format et taille vérifiés par l'application.
 */
export const photosEmployes = mysqlTable(
  "photos_employes",
  {
    employeId: char("employe_id", { length: 36 })
      .primaryKey()
      .references(() => employes.id, { onDelete: "cascade" }),
    typeMime: varchar("type_mime", { length: 20 }).notNull(),
    contenu: mediumBlob("contenu").notNull(),
    tailleOctets: int("taille_octets").notNull(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    check("photos_employes_type_mime", sql`${table.typeMime} IN ('image/jpeg', 'image/png', 'image/webp')`),
    check("photos_employes_taille", sql`${table.tailleOctets} BETWEEN 1 AND 524288`),
  ],
);

/**
 * Pointages (arrivées, départs, pauses, heures supplémentaires). Pour l'instant saisis à la main
 * (gestion des exceptions) ; la badgeuse les ajoutera avec la source « badgeuse ».
 * L'horodatage est en UTC ; un même état ne peut pas être pointé deux fois au même instant.
 */
export const pointages = mysqlTable(
  "pointages",
  {
    id: identifiantUnique(),
    employeId: char("employe_id", { length: 36 })
      .notNull()
      .references(() => employes.id, { onDelete: "cascade" }),
    horodatage: date("horodatage").notNull(),
    etat: varchar("etat", { length: 20 }).notNull(),
    source: varchar("source", { length: 20 }).notNull().default("manuel"),
    remarque: varchar("remarque", { length: 255 }),
    // Qui a saisi le pointage (journal) ; gardé si ce compte est supprimé.
    saisiPar: char("saisi_par", { length: 36 }).references(() => utilisateurs.id, { onDelete: "set null" }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("pointages_employe_horodatage_etat_idx").on(table.employeId, table.horodatage, table.etat),
    index("pointages_horodatage_idx").on(table.horodatage),
    index("pointages_saisi_par_idx").on(table.saisiPar),
    check(
      "pointages_etat",
      sql`${table.etat} IN ('entree', 'sortie', 'debut_pause', 'fin_pause', 'debut_heures_sup', 'fin_heures_sup')`,
    ),
    check("pointages_source", sql`${table.source} IN ('manuel', 'badgeuse')`),
  ],
);

/**
 * Calendriers (créneaux horaires). Les heures sont en minutes depuis minuit (0 à 1439) :
 * une fin plus petite que le début signifie un service de nuit qui finit le lendemain.
 */
export const calendriers = mysqlTable(
  "calendriers",
  {
    id: identifiantUnique(),
    nom: varchar("nom", { length: 60 }).notNull(),
    debutMinutes: int("debut_minutes").notNull(),
    finMinutes: int("fin_minutes").notNull(),
    // Pause de … à … (vides toutes les deux = pas de pause), comprise dans le service.
    pauseDebutMinutes: int("pause_debut_minutes"),
    pauseFinMinutes: int("pause_fin_minutes"),
    // Fenêtres où un pointage compte comme entrée ou sortie de ce service.
    entreeAvantMinutes: int("entree_avant_minutes").notNull().default(60),
    entreeApresMinutes: int("entree_apres_minutes").notNull().default(60),
    sortieAvantMinutes: int("sortie_avant_minutes").notNull().default(60),
    sortieApresMinutes: int("sortie_apres_minutes").notNull().default(60),
    retardTolereMinutes: int("retard_tolere_minutes").notNull().default(0),
    departAnticipeTolereMinutes: int("depart_anticipe_tolere_minutes").notNull().default(0),
    pointageEntreeObligatoire: boolean("pointage_entree_obligatoire").notNull().default(true),
    pointageSortieObligatoire: boolean("pointage_sortie_obligatoire").notNull().default(true),
    heuresSupActives: boolean("heures_sup_actives").notNull().default(false),
    heuresSupApresMinutes: int("heures_sup_apres_minutes").notNull().default(0),
    heuresSupMinimumMinutes: int("heures_sup_minimum_minutes").notNull().default(30),
    // 0 = sans limite.
    heuresSupMaximumMinutes: int("heures_sup_maximum_minutes").notNull().default(0),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("calendriers_nom_idx").on(table.nom),
    check("calendriers_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
    check("calendriers_heures_valides", sql`${table.debutMinutes} BETWEEN 0 AND 1439 AND ${table.finMinutes} BETWEEN 0 AND 1439 AND ${table.debutMinutes} <> ${table.finMinutes}`),
    check(
      "calendriers_pause_valide",
      sql`(${table.pauseDebutMinutes} IS NULL AND ${table.pauseFinMinutes} IS NULL) OR (${table.pauseDebutMinutes} BETWEEN 0 AND 1439 AND ${table.pauseFinMinutes} BETWEEN 0 AND 1439 AND ${table.pauseDebutMinutes} <> ${table.pauseFinMinutes})`,
    ),
    check(
      "calendriers_fenetres_bornees",
      sql`${table.entreeAvantMinutes} BETWEEN 0 AND 720 AND ${table.entreeApresMinutes} BETWEEN 0 AND 720 AND ${table.sortieAvantMinutes} BETWEEN 0 AND 720 AND ${table.sortieApresMinutes} BETWEEN 0 AND 720`,
    ),
    check("calendriers_tolerances_bornees", sql`${table.retardTolereMinutes} BETWEEN 0 AND 240 AND ${table.departAnticipeTolereMinutes} BETWEEN 0 AND 240`),
    check(
      "calendriers_heures_sup_bornees",
      sql`${table.heuresSupApresMinutes} BETWEEN 0 AND 720 AND ${table.heuresSupMinimumMinutes} BETWEEN 0 AND 720 AND ${table.heuresSupMaximumMinutes} BETWEEN 0 AND 1440`,
    ),
  ],
);

/** Groupes d'employés, auxquels on affecte une rotation d'un seul coup. */
export const groupes = mysqlTable(
  "groupes",
  {
    id: identifiantUnique(),
    nom: varchar("nom", { length: 60 }).notNull(),
    description: varchar("description", { length: 255 }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("groupes_nom_idx").on(table.nom),
    check("groupes_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
  ],
);

/**
 * Rotations : « hebdomadaire » (7 jours, du lundi au dimanche) ou « cycle » de N jours
 * qui recommence à partir de la date de début de l'affectation.
 */
export const rotations = mysqlTable(
  "rotations",
  {
    id: identifiantUnique(),
    nom: varchar("nom", { length: 60 }).notNull(),
    type: varchar("type", { length: 12 }).notNull(),
    nombreJours: int("nombre_jours").notNull(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("rotations_nom_idx").on(table.nom),
    check("rotations_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
    check(
      "rotations_type_et_duree",
      sql`(${table.type} = 'hebdomadaire' AND ${table.nombreJours} = 7) OR (${table.type} = 'cycle' AND ${table.nombreJours} BETWEEN 1 AND 31)`,
    ),
  ],
);

/** Jours travaillés d'une rotation (un jour absent = repos). */
export const joursRotation = mysqlTable(
  "jours_rotation",
  {
    id: identifiantUnique(),
    rotationId: char("rotation_id", { length: 36 })
      .notNull()
      .references(() => rotations.id, { onDelete: "cascade" }),
    numeroJour: int("numero_jour").notNull(),
    calendrierId: char("calendrier_id", { length: 36 })
      .notNull()
      .references(() => calendriers.id, { onDelete: "restrict" }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("jours_rotation_rotation_jour_idx").on(table.rotationId, table.numeroJour),
    index("jours_rotation_calendrier_idx").on(table.calendrierId),
    check("jours_rotation_numero_borne", sql`${table.numeroJour} BETWEEN 0 AND 30`),
  ],
);

/**
 * Affectation d'une rotation à un groupe OU à un employé, sur une période.
 * L'affectation d'un employé passe avant celle de son groupe.
 */
export const affectations = mysqlTable(
  "affectations",
  {
    id: identifiantUnique(),
    rotationId: char("rotation_id", { length: 36 })
      .notNull()
      .references(() => rotations.id, { onDelete: "restrict" }),
    // restrict (et non cascade) : MySQL 8 refuse un CHECK sur une colonne à suppression en cascade.
    // Les affectations d'un groupe ou d'un employé sont supprimées avec lui, dans une transaction.
    groupeId: char("groupe_id", { length: 36 }).references(() => groupes.id, { onDelete: "restrict" }),
    employeId: char("employe_id", { length: 36 }).references(() => employes.id, { onDelete: "restrict" }),
    dateDebut: jour("date_debut").notNull(),
    // Vide = sans date de fin.
    dateFin: jour("date_fin"),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    index("affectations_rotation_idx").on(table.rotationId),
    index("affectations_groupe_idx").on(table.groupeId, table.dateDebut),
    index("affectations_employe_idx").on(table.employeId, table.dateDebut),
    check("affectations_une_seule_cible", sql`(${table.groupeId} IS NULL) <> (${table.employeId} IS NULL)`),
    check("affectations_dates_coherentes", sql`${table.dateFin} IS NULL OR ${table.dateFin} >= ${table.dateDebut}`),
  ],
);
