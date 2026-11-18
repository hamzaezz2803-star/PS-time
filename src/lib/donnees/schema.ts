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
import { PAGES, POLICES, THEMES } from "../constantes.ts";

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

/** Liste SQL `'a', 'b'` tirée d'une constante de l'application (valeurs fixes, jamais saisies). */
const listeSql = (valeurs: readonly string[]) => sql.raw(valeurs.map((valeur) => `'${valeur}'`).join(", "));

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
    // Dernière ouverture des notifications : les plus récentes sont « non lues ».
    notificationsLuesLe: date("notifications_lues_le"),
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

/**
 * Pages qu'un administrateur a le droit de voir et de gérer (une ligne par page accordée).
 * Un super administrateur a tous les droits sans ligne ici. Supprimées avec l'utilisateur.
 */
export const autorisationsPages = mysqlTable(
  "autorisations_pages",
  {
    id: identifiantUnique(),
    utilisateurId: referenceUtilisateur(),
    page: varchar("page", { length: 30 }).notNull(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("autorisations_pages_utilisateur_page_idx").on(table.utilisateurId, table.page),
    check("autorisations_pages_page_valide", sql`${table.page} IN (${listeSql(PAGES)})`),
  ],
);

/**
 * Réglages de l'installation (une ligne par réglage), modifiés par le super administrateur :
 * thème de couleurs et police. La base n'accepte que les valeurs connues de l'application.
 */
export const parametres = mysqlTable(
  "parametres",
  {
    id: identifiantUnique(),
    cle: varchar("cle", { length: 30 }).notNull(),
    valeur: varchar("valeur", { length: 50 }).notNull(),
    modifiePar: char("modifie_par", { length: 36 }).references(() => utilisateurs.id, { onDelete: "set null" }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("parametres_cle_idx").on(table.cle),
    index("parametres_modifie_par_idx").on(table.modifiePar),
    check(
      "parametres_valeur_valide",
      sql`(${table.cle} = 'theme' AND ${table.valeur} IN (${listeSql(THEMES)})) OR (${table.cle} = 'police' AND ${table.valeur} IN (${listeSql(POLICES)}))`,
    ),
  ],
);

/**
 * Journal des actions, affiché dans la cloche de notifications. Chaque ligne dit qui a fait
 * quoi sur quel élément (`libelle` : nom affiché, jamais de pièce d'identité ni de contact).
 * Visible selon le module ; `administration` est réservé au super administrateur.
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: identifiantUnique(),
    module: varchar("module", { length: 20 }).notNull(),
    action: varchar("action", { length: 20 }).notNull(),
    objet: varchar("objet", { length: 30 }).notNull(),
    libelle: varchar("libelle", { length: 150 }),
    lien: varchar("lien", { length: 200 }),
    // Auteur : gardé par son nom si le compte est supprimé ensuite.
    auteurId: char("auteur_id", { length: 36 }).references(() => utilisateurs.id, { onDelete: "set null" }),
    auteurNom: varchar("auteur_nom", { length: 100 }).notNull(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    index("notifications_module_date_idx").on(table.module, table.creeLe),
    index("notifications_date_idx").on(table.creeLe),
    index("notifications_auteur_idx").on(table.auteurId),
    check("notifications_module_valide", sql`${table.module} IN ('personnel', 'planning', 'presence', 'administration')`),
    check("notifications_action_valide", sql`${table.action} IN ('creation', 'modification', 'suppression')`),
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
    // Vrai : son horaire du jour est reconnu d'après son premier pointage (règles horaires).
    horaireDynamique: boolean("horaire_dynamique").notNull().default(false),
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
 * Profils horaires (modèle d'une journée) : code de 3 caractères, libellé, type « travail » ou
 * « repos », badgé ou non. Les plages de la journée sont dans `plages_profils`.
 */
export const profilsHoraires = mysqlTable(
  "profils_horaires",
  {
    id: identifiantUnique(),
    code: varchar("code", { length: 3 }).notNull(),
    nom: varchar("nom", { length: 60 }).notNull(),
    type: varchar("type", { length: 10 }).notNull().default("travail"),
    estBadge: boolean("est_badge").notNull().default(true),
    // Durée de la pause repas : minimum et maximum (vides = non contrôlée).
    repasMinimumMinutes: int("repas_minimum_minutes"),
    repasMaximumMinutes: int("repas_maximum_minutes"),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("profils_horaires_code_idx").on(table.code),
    uniqueIndex("profils_horaires_nom_idx").on(table.nom),
    check("profils_horaires_code_valide", sql`${table.code} REGEXP '^[A-Z0-9]{1,3}$'`),
    check("profils_horaires_nom_non_vide", sql`CHAR_LENGTH(TRIM(${table.nom})) > 0`),
    check("profils_horaires_type_valide", sql`${table.type} IN ('travail', 'repos')`),
    check(
      "profils_horaires_repas_borne",
      sql`(${table.repasMinimumMinutes} IS NULL OR ${table.repasMinimumMinutes} BETWEEN 0 AND 720) AND (${table.repasMaximumMinutes} IS NULL OR ${table.repasMaximumMinutes} BETWEEN 0 AND 720)`,
    ),
  ],
);

/**
 * Plages d'un profil : de `debut` à `fin` (minutes depuis minuit, fin exclue, 1440 = 24:00).
 * Bout à bout de 00:00 à 24:00 (vérifié par l'application). Supprimées avec leur profil.
 */
export const plagesProfils = mysqlTable(
  "plages_profils",
  {
    id: identifiantUnique(),
    profilId: char("profil_id", { length: 36 })
      .notNull()
      .references(() => profilsHoraires.id, { onDelete: "cascade" }),
    debutMinutes: int("debut_minutes").notNull(),
    finMinutes: int("fin_minutes").notNull(),
    type: varchar("type", { length: 15 }).notNull(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("plages_profils_profil_debut_idx").on(table.profilId, table.debutMinutes),
    check("plages_profils_bornes", sql`${table.debutMinutes} BETWEEN 0 AND 1439 AND ${table.finMinutes} BETWEEN 1 AND 1440 AND ${table.finMinutes} > ${table.debutMinutes}`),
    check(
      "plages_profils_type_valide",
      sql`${table.type} IN ('interdite', 'neutralisee', 'variable', 'fixe', 'repas', 'retard_tolere')`,
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

/** Profil horaire de chaque jour d'une rotation (un jour absent = repos). */
export const joursRotation = mysqlTable(
  "jours_rotation",
  {
    id: identifiantUnique(),
    rotationId: char("rotation_id", { length: 36 })
      .notNull()
      .references(() => rotations.id, { onDelete: "cascade" }),
    numeroJour: int("numero_jour").notNull(),
    // Un profil utilisé par une rotation ne peut pas être supprimé.
    profilId: char("profil_id", { length: 36 })
      .notNull()
      .references(() => profilsHoraires.id, { onDelete: "restrict" }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("jours_rotation_rotation_jour_idx").on(table.rotationId, table.numeroJour),
    index("jours_rotation_profil_idx").on(table.profilId),
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

/**
 * Règles de l'horaire dynamique : si le premier pointage du jour tombe entre `debut` et `fin`
 * (minutes depuis minuit, fin exclue) un des jours indiqués, l'employé suit ce profil horaire.
 * Jours : chiffres de 1 (lundi) à 7 (dimanche), ex. « 12345 ». Pas de fenêtre après minuit
 * (pas de service de nuit pour l'instant). Le non-chevauchement est vérifié par l'application.
 */
export const reglesHoraires = mysqlTable(
  "regles_horaires",
  {
    id: identifiantUnique(),
    debutMinutes: int("debut_minutes").notNull(),
    finMinutes: int("fin_minutes").notNull(),
    joursSemaine: varchar("jours_semaine", { length: 7 }).notNull().default("1234567"),
    // Un profil utilisé par une règle ne peut pas être supprimé.
    profilId: char("profil_id", { length: 36 })
      .notNull()
      .references(() => profilsHoraires.id, { onDelete: "restrict" }),
    estActif: boolean("est_actif").notNull().default(true),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    index("regles_horaires_profil_idx").on(table.profilId),
    check("regles_horaires_bornes", sql`${table.debutMinutes} BETWEEN 0 AND 1439 AND ${table.finMinutes} BETWEEN 1 AND 1440 AND ${table.finMinutes} > ${table.debutMinutes}`),
    check("regles_horaires_jours_valides", sql`${table.joursSemaine} REGEXP '^[1-7]{1,7}$'`),
  ],
);

/** Auteur d'une création ou d'une modification : gardé vide si le compte est supprimé. */
const referenceAuteur = (nom: string) => char(nom, { length: 36 }).references(() => utilisateurs.id, { onDelete: "set null" });

/**
 * Compteurs (retard, heures sup., absences du mois...) : une formule calculée sur les variables
 * d'une journée, d'une semaine ou d'un mois. Les valeurs sont calculées à la demande, jamais
 * stockées. Supprimer un compteur supprime aussi ses versions (dans une transaction) ; le
 * désactiver garde son historique.
 */
export const compteurs = mysqlTable(
  "compteurs",
  {
    id: identifiantUnique(),
    // Identifiant lisible, en majuscules (ex. RETARD_JOUR).
    code: varchar("code", { length: 30 }).notNull(),
    // Unique sans tenir compte des majuscules ni des accents (interclassement *_ci de la base).
    libelle: varchar("libelle", { length: 100 }).notNull(),
    formule: varchar("formule", { length: 2000 }).notNull(),
    journalier: boolean("journalier").notNull().default(false),
    hebdomadaire: boolean("hebdomadaire").notNull().default(false),
    mensuel: boolean("mensuel").notNull().default(false),
    unite: varchar("unite", { length: 12 }).notNull(),
    description: varchar("description", { length: 500 }),
    estActif: boolean("est_actif").notNull().default(true),
    // Augmente à chaque changement de formule, d'unité ou de périodicité.
    version: int("version").notNull().default(1),
    creePar: referenceAuteur("cree_par"),
    modifiePar: referenceAuteur("modifie_par"),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("compteurs_code_idx").on(table.code),
    uniqueIndex("compteurs_libelle_idx").on(table.libelle),
    index("compteurs_cree_par_idx").on(table.creePar),
    index("compteurs_modifie_par_idx").on(table.modifiePar),
    check("compteurs_code_valide", sql`${table.code} REGEXP '^[A-Z0-9][A-Z0-9_-]{0,29}$'`),
    check("compteurs_libelle_non_vide", sql`CHAR_LENGTH(TRIM(${table.libelle})) > 0`),
    check("compteurs_formule_non_vide", sql`CHAR_LENGTH(TRIM(${table.formule})) > 0`),
    check("compteurs_une_periodicite", sql`${table.journalier} OR ${table.hebdomadaire} OR ${table.mensuel}`),
    check("compteurs_unite_valide", sql`${table.unite} IN ('minutes', 'heures', 'jours', 'nombre', 'pourcentage')`),
    check("compteurs_version_positive", sql`${table.version} >= 1`),
  ],
);

/** Versions successives d'un compteur (piste d'audit) : formule, unité et périodicités de chaque version. */
export const compteursVersions = mysqlTable(
  "compteurs_versions",
  {
    id: identifiantUnique(),
    compteurId: char("compteur_id", { length: 36 })
      .notNull()
      .references(() => compteurs.id, { onDelete: "restrict" }),
    version: int("version").notNull(),
    formule: varchar("formule", { length: 2000 }).notNull(),
    journalier: boolean("journalier").notNull(),
    hebdomadaire: boolean("hebdomadaire").notNull(),
    mensuel: boolean("mensuel").notNull(),
    unite: varchar("unite", { length: 12 }).notNull(),
    modifiePar: referenceAuteur("modifie_par"),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("compteurs_versions_compteur_version_idx").on(table.compteurId, table.version),
    index("compteurs_versions_modifie_par_idx").on(table.modifiePar),
  ],
);
