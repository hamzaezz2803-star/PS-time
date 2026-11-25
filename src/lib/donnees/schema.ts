import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  customType,
  date as dateCalendrier,
  foreignKey,
  index,
  integer as int,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { ACTIONS_HISTORIQUE, COULEUR_REGLE_DEFAUT, COULEURS_REGLE, COULEURS_PERSONNALISABLES,MODULES_HISTORIQUE, PAGES, POLICES, TAILLES_TEXTE, THEMES, TYPES_EVENEMENT, TYPES_PIECE_JOINTE, UNITES_SAISIE_EVENEMENT, DUREE_EVENEMENT_MAX_MINUTES, PIECE_JOINTE_TAILLE_MAX_OCTETS } from "../constantes.ts";

/**
 * Schéma de la base. Toute modification passe par une migration :
 * `npm run db:generer -- --name <nom>` puis `npm run db:migrer`.
 *
 * PostgreSQL 13 ou plus. Dates en `timestamptz` (UTC) ; `modifie_le` est tenu à jour par le
 * déclencheur `maj_modifie_le` (migration 0000, que Drizzle ne sait pas écrire).
 * Les tables utilisateurs, sessions, comptes et verifications suivent le
 * modèle de Better Auth (voir src/lib/donnees/authentification.ts).
 */

// UUID v4 aléatoire fourni par l'application ; le défaut SQL sert à une insertion manuelle (DBeaver).
const identifiantUnique = () =>
  uuid("id")
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => crypto.randomUUID());

/** Liste SQL `'a', 'b'` tirée d'une constante de l'application (valeurs fixes, jamais saisies). */
const listeSql = (valeurs: readonly string[]) => sql.raw(valeurs.map((valeur) => `'${valeur}'`).join(", "));

const referenceUtilisateur = () =>
  uuid("utilisateur_id")
    .notNull()
    .references(() => utilisateurs.id, { onDelete: "cascade" });

const date = (nom: string) => timestamp(nom, { precision: 3, withTimezone: true, mode: "date" });

const dateCreation = () => date("cree_le").notNull().defaultNow();

// Mise à jour automatique : déclencheur `maj_modifie_le` sur chaque table (voir l'en-tête).
const dateModification = () => date("modifie_le").notNull().defaultNow();

export const utilisateurs = pgTable(
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
    check(
      "utilisateurs_email_minuscules",
      sql`${table.email} = lower(${table.email})`,
    ),
    check(
      "utilisateurs_identifiant_minuscules",
      sql`${table.identifiant} = lower(${table.identifiant})`,
    ),
    check("utilisateurs_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
  ],
);

/** Sessions de connexion. Le jeton est stocké dans un cookie httpOnly. */
export const sessions = pgTable(
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
export const comptes = pgTable(
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
export const autorisationsPages = pgTable(
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
 * thème, police, taille du texte et couleurs personnalisées (`#rrggbb`). La base n'accepte
 * que les valeurs connues de l'application.
 */
export const parametres = pgTable(
  "parametres",
  {
    id: identifiantUnique(),
    cle: varchar("cle", { length: 30 }).notNull(),
    valeur: varchar("valeur", { length: 50 }).notNull(),
    modifiePar: uuid("modifie_par").references(() => utilisateurs.id, { onDelete: "set null" }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("parametres_cle_idx").on(table.cle),
    index("parametres_modifie_par_idx").on(table.modifiePar),
    check(
      "parametres_valeur_valide",
      sql`(${table.cle} = 'theme' AND ${table.valeur} IN (${listeSql(THEMES)})) OR (${table.cle} = 'police' AND ${table.valeur} IN (${listeSql(POLICES)})) OR (${table.cle} = 'taille_texte' AND ${table.valeur} IN (${listeSql(TAILLES_TEXTE)})) OR (${table.cle} IN (${listeSql(COULEURS_PERSONNALISABLES.map((couleur) => `couleur_${couleur}`))}) AND ${table.valeur} ~ '^#[0-9a-f]{6}$')`,
    ),
  ],
);

/**
 * Journal des actions, affiché dans la cloche de notifications. Chaque ligne dit qui a fait
 * quoi sur quel élément (`libelle` : nom affiché, jamais de pièce d'identité ni de contact).
 * Visible selon le module ; `administration` est réservé au super administrateur.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: identifiantUnique(),
    module: varchar("module", { length: 20 }).notNull(),
    action: varchar("action", { length: 20 }).notNull(),
    objet: varchar("objet", { length: 30 }).notNull(),
    libelle: varchar("libelle", { length: 150 }),
    lien: varchar("lien", { length: 200 }),
    // Auteur : gardé par son nom si le compte est supprimé ensuite.
    auteurId: uuid("auteur_id").references(() => utilisateurs.id, { onDelete: "set null" }),
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

/**
 * Historique des actions (traçabilité), visible par le super administrateur seulement :
 * créations, modifications, suppressions, connexions, déconnexions et exports, de tous les
 * comptes. `libelle` : nom affiché, jamais de pièce d'identité, de contact ni de mot de passe.
 * L'auteur est gardé par son nom et son identifiant si le compte est supprimé ensuite.
 */
export const historique = pgTable(
  "historique",
  {
    id: identifiantUnique(),
    action: varchar("action", { length: 20 }).notNull(),
    objet: varchar("objet", { length: 30 }).notNull(),
    module: varchar("module", { length: 20 }).notNull(),
    libelle: varchar("libelle", { length: 150 }),
    lien: varchar("lien", { length: 200 }),
    auteurId: uuid("auteur_id").references(() => utilisateurs.id, { onDelete: "set null" }),
    auteurNom: varchar("auteur_nom", { length: 100 }).notNull(),
    auteurIdentifiant: varchar("auteur_identifiant", { length: 50 }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    index("historique_date_idx").on(table.creeLe),
    index("historique_auteur_date_idx").on(table.auteurId, table.creeLe),
    index("historique_module_date_idx").on(table.module, table.creeLe),
    check("historique_action_valide", sql`${table.action} IN (${listeSql(ACTIONS_HISTORIQUE)})`),
    check("historique_module_valide", sql`${table.module} IN (${listeSql(MODULES_HISTORIQUE)})`),
  ],
);

/** Jetons temporaires (réinitialisation de mot de passe, vérification d'e-mail). */
export const verifications = pgTable(
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
export const sites = pgTable(
  "sites",
  {
    id: identifiantUnique(),
    nom: varchar("nom", { length: 100 }).notNull(),
    adresse: varchar("adresse", { length: 255 }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("sites_nom_idx").on(sql`lower(${table.nom})`),
    check("sites_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
  ],
);

/** Site facultatif d'un département, d'un poste ou d'un employé. */
const referenceSite = () =>
  uuid("site_id").references(() => sites.id, { onDelete: "restrict" });

/**
 * Départements de l'entreprise, organisés en arbre (un parent, plusieurs enfants).
 * Un département qui a des sous-départements ne peut pas être supprimé (restrict).
 */
export const departements = pgTable(
  "departements",
  {
    id: identifiantUnique(),
    nom: varchar("nom", { length: 100 }).notNull(),
    parentId: uuid("parent_id").references(
      (): AnyPgColumn => departements.id,
      { onDelete: "restrict" },
    ),
    siteId: referenceSite(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    // Deux sous-départements d'un même parent ne peuvent pas porter le même nom.
    // (À la racine, parent_id est NULL : l'application fait la vérification.)
    uniqueIndex("departements_parent_nom_idx").on(table.parentId, sql`lower(${table.nom})`),
    index("departements_parent_idx").on(table.parentId),
    index("departements_site_idx").on(table.siteId),
    check("departements_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
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
export const postes = pgTable(
  "postes",
  {
    id: identifiantUnique(),
    code: varchar("code", { length: 30 }).notNull(),
    nom: varchar("nom", { length: 100 }).notNull(),
    ordre: int("ordre").notNull().default(99999),
    parentId: uuid("parent_id").references(
      (): AnyPgColumn => postes.id,
      { onDelete: "restrict" },
    ),
    siteId: referenceSite(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("postes_code_idx").on(sql`lower(${table.code})`),
    uniqueIndex("postes_parent_nom_idx").on(table.parentId, sql`lower(${table.nom})`),
    index("postes_parent_idx").on(table.parentId),
    index("postes_site_idx").on(table.siteId),
    check("postes_code_non_vide", sql`char_length(trim(${table.code})) > 0`),
    check("postes_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
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
export const employes = pgTable(
  "employes",
  {
    id: identifiantUnique(),
    matricule: varchar("matricule", { length: 30 }).notNull(),
    numeroBadge: varchar("numero_badge", { length: 30 }).notNull(),
    prenom: varchar("prenom", { length: 100 }).notNull(),
    nom: varchar("nom", { length: 100 }).notNull(),
    departementId: uuid("departement_id")
      .notNull()
      .references(() => departements.id, { onDelete: "restrict" }),
    posteId: uuid("poste_id").references(() => postes.id, {
      onDelete: "set null",
    }),
    groupeId: uuid("groupe_id").references((): AnyPgColumn => groupes.id, {
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
    // Pointage hors badgeuse (PC, tablette, téléphone) : autorisation et conditions exigées.
    pointageDistance: boolean("pointage_distance").notNull().default(false),
    // Appareils autorisés, codes séparés par des virgules (ex. « pc,tablette ») ; vide si non autorisé.
    appareilsDistance: varchar("appareils_distance", { length: 30 }).notNull().default(""),
    distanceExigePosition: boolean("distance_exige_position").notNull().default(false),
    distanceExigePhoto: boolean("distance_exige_photo").notNull().default(false),
    // Doigts prévus pour l'enrôlement sur la badgeuse (chiffres 0 à 9, ex. « 56 »). Jamais d'empreinte.
    doigtsAEnroler: varchar("doigts_a_enroler", { length: 10 }).notNull().default(""),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    check("employes_appareils_distance_valides", sql`${table.appareilsDistance} ~ '^((pc|tablette|telephone)(,(pc|tablette|telephone)){0,2})?$'`),
    check("employes_doigts_valides", sql`${table.doigtsAEnroler} ~ '^[0-9]{0,10}$'`),
    // Sans autorisation, aucun appareil ni condition n'est gardé.
    check(
      "employes_distance_coherente",
      sql`${table.pointageDistance} OR (${table.appareilsDistance} = '' AND NOT ${table.distanceExigePosition} AND NOT ${table.distanceExigePhoto})`,
    ),
    uniqueIndex("employes_matricule_idx").on(sql`lower(${table.matricule})`),
    uniqueIndex("employes_numero_badge_idx").on(sql`lower(${table.numeroBadge})`),
    uniqueIndex("employes_piece_identite_idx").on(table.typePieceIdentite, sql`lower(${table.numeroPieceIdentite})`),
    // Plusieurs NULL sont permis par un index unique : l'e-mail reste facultatif.
    uniqueIndex("employes_email_idx").on(table.email),
    index("employes_departement_idx").on(table.departementId),
    index("employes_poste_idx").on(table.posteId),
    index("employes_groupe_idx").on(table.groupeId),
    index("employes_site_idx").on(table.siteId),
    index("employes_nom_idx").on(table.nom, table.prenom),
    check("employes_matricule_non_vide", sql`char_length(trim(${table.matricule})) > 0`),
    check("employes_prenom_non_vide", sql`char_length(trim(${table.prenom})) > 0`),
    check("employes_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
    check("employes_numero_badge_non_vide", sql`char_length(trim(${table.numeroBadge})) > 0`),
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
      sql`${table.email} IS NULL OR ${table.email} = lower(${table.email})`,
    ),
    check(
      "employes_telephone_e164",
      sql`${table.telephone} IS NULL OR ${table.telephone} ~ '^[+][1-9][0-9]{7,14}$'`,
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
export const informationsEmployes = pgTable(
  "informations_employes",
  {
    id: identifiantUnique(),
    employeId: uuid("employe_id")
      .notNull()
      .references(() => employes.id, { onDelete: "cascade" }),
    libelle: varchar("libelle", { length: 60 }).notNull(),
    valeur: varchar("valeur", { length: 255 }).notNull(),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("informations_employes_employe_libelle_idx").on(table.employeId, sql`lower(${table.libelle})`),
    check("informations_employes_libelle_non_vide", sql`char_length(trim(${table.libelle})) > 0`),
    check("informations_employes_valeur_non_vide", sql`char_length(trim(${table.valeur})) > 0`),
  ],
);

// Contenu binaire (photo, pièce jointe), lu et écrit en Buffer.
const binaire = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/**
 * Photo de profil d'un employé (facultative, une au plus), gardée en base : sauvegardée
 * avec elle et jamais servie publiquement. Format et taille vérifiés par l'application.
 */
export const photosEmployes = pgTable(
  "photos_employes",
  {
    employeId: uuid("employe_id")
      .primaryKey()
      .references(() => employes.id, { onDelete: "cascade" }),
    typeMime: varchar("type_mime", { length: 20 }).notNull(),
    contenu: binaire("contenu").notNull(),
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
export const pointages = pgTable(
  "pointages",
  {
    id: identifiantUnique(),
    employeId: uuid("employe_id")
      .notNull()
      .references(() => employes.id, { onDelete: "cascade" }),
    horodatage: date("horodatage").notNull(),
    etat: varchar("etat", { length: 20 }).notNull(),
    source: varchar("source", { length: 20 }).notNull().default("manuel"),
    remarque: varchar("remarque", { length: 255 }),
    // Qui a saisi le pointage (journal) ; gardé si ce compte est supprimé.
    saisiPar: uuid("saisi_par").references(() => utilisateurs.id, { onDelete: "set null" }),
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
export const profilsHoraires = pgTable(
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
    uniqueIndex("profils_horaires_nom_idx").on(sql`lower(${table.nom})`),
    check("profils_horaires_code_valide", sql`${table.code} ~ '^[A-Z0-9]{1,3}$'`),
    check("profils_horaires_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
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
export const plagesProfils = pgTable(
  "plages_profils",
  {
    id: identifiantUnique(),
    profilId: uuid("profil_id")
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
export const groupes = pgTable(
  "groupes",
  {
    id: identifiantUnique(),
    nom: varchar("nom", { length: 60 }).notNull(),
    description: varchar("description", { length: 255 }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("groupes_nom_idx").on(sql`lower(${table.nom})`),
    check("groupes_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
  ],
);

/**
 * Rotations : « hebdomadaire » (7 jours, du lundi au dimanche) ou « cycle » de N jours
 * qui recommence à partir de la date de début de l'affectation.
 */
export const rotations = pgTable(
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
    uniqueIndex("rotations_nom_idx").on(sql`lower(${table.nom})`),
    check("rotations_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
    check(
      "rotations_type_et_duree",
      sql`(${table.type} = 'hebdomadaire' AND ${table.nombreJours} = 7) OR (${table.type} = 'cycle' AND ${table.nombreJours} BETWEEN 1 AND 31)`,
    ),
  ],
);

/** Profil horaire de chaque jour d'une rotation (un jour absent = repos). */
export const joursRotation = pgTable(
  "jours_rotation",
  {
    id: identifiantUnique(),
    rotationId: uuid("rotation_id")
      .notNull()
      .references(() => rotations.id, { onDelete: "cascade" }),
    numeroJour: int("numero_jour").notNull(),
    // Un profil utilisé par une rotation ne peut pas être supprimé.
    profilId: uuid("profil_id")
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
export const affectations = pgTable(
  "affectations",
  {
    id: identifiantUnique(),
    rotationId: uuid("rotation_id")
      .notNull()
      .references(() => rotations.id, { onDelete: "restrict" }),
    // restrict : les affectations d'un groupe ou d'un employé sont supprimées avec lui, dans une transaction.
    groupeId: uuid("groupe_id").references(() => groupes.id, { onDelete: "restrict" }),
    employeId: uuid("employe_id").references(() => employes.id, { onDelete: "restrict" }),
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
export const reglesHoraires = pgTable(
  "regles_horaires",
  {
    id: identifiantUnique(),
    debutMinutes: int("debut_minutes").notNull(),
    finMinutes: int("fin_minutes").notNull(),
    joursSemaine: varchar("jours_semaine", { length: 7 }).notNull().default("1234567"),
    // Un profil utilisé par une règle ne peut pas être supprimé.
    profilId: uuid("profil_id")
      .notNull()
      .references(() => profilsHoraires.id, { onDelete: "restrict" }),
    estActif: boolean("est_actif").notNull().default(true),
    // Couleur de la pastille dans le rapport des présences (palette fixe).
    couleur: varchar("couleur", { length: 15 }).notNull().default(COULEUR_REGLE_DEFAUT),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    index("regles_horaires_profil_idx").on(table.profilId),
    check("regles_horaires_couleur_valide", sql`${table.couleur} IN (${listeSql(COULEURS_REGLE)})`),
    check("regles_horaires_bornes", sql`${table.debutMinutes} BETWEEN 0 AND 1439 AND ${table.finMinutes} BETWEEN 1 AND 1440 AND ${table.finMinutes} > ${table.debutMinutes}`),
    check("regles_horaires_jours_valides", sql`${table.joursSemaine} ~ '^[1-7]{1,7}$'`),
  ],
);

/** Auteur d'une création ou d'une modification : gardé vide si le compte est supprimé. */
const referenceAuteur = (nom: string) => uuid(nom).references(() => utilisateurs.id, { onDelete: "set null" });

/**
 * Compteurs (retard, heures sup., absences du mois...) : une formule calculée sur les variables
 * d'une journée, d'une semaine ou d'un mois. Les valeurs sont calculées à la demande, jamais
 * stockées. Supprimer un compteur supprime aussi ses versions (dans une transaction) ; le
 * désactiver garde son historique.
 */
export const compteurs = pgTable(
  "compteurs",
  {
    id: identifiantUnique(),
    // Identifiant lisible, en majuscules (ex. RETARD_JOUR).
    code: varchar("code", { length: 30 }).notNull(),
    // Unique sans tenir compte des majuscules (index sur lower()).
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
    uniqueIndex("compteurs_libelle_idx").on(sql`lower(${table.libelle})`),
    index("compteurs_cree_par_idx").on(table.creePar),
    index("compteurs_modifie_par_idx").on(table.modifiePar),
    check("compteurs_code_valide", sql`${table.code} ~ '^[A-Z0-9][A-Z0-9_-]{0,29}$'`),
    check("compteurs_libelle_non_vide", sql`char_length(trim(${table.libelle})) > 0`),
    check("compteurs_formule_non_vide", sql`char_length(trim(${table.formule})) > 0`),
    check("compteurs_une_periodicite", sql`${table.journalier} OR ${table.hebdomadaire} OR ${table.mensuel}`),
    check("compteurs_unite_valide", sql`${table.unite} IN ('minutes', 'heures', 'jours', 'nombre', 'pourcentage')`),
    check("compteurs_version_positive", sql`${table.version} >= 1`),
  ],
);

/** Versions successives d'un compteur (piste d'audit) : formule, unité et périodicités de chaque version. */
export const compteursVersions = pgTable(
  "compteurs_versions",
  {
    id: identifiantUnique(),
    compteurId: uuid("compteur_id")
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

/**
 * Événements : motifs d'absence ou de présence (congé, maladie, formation, mission...).
 * `est_prioritaire_sur_pointages` : l'événement reste retenu même si l'employé a pointé
 * (ex. formation non badgée). `priorite` départage deux événements (le plus grand l'emporte).
 * `unite_saisie` : journée, demi-journée ou heures ; `duree_minutes` : durée d'un événement en heures.
 * `code_paie` vide : l'événement n'est pas transmis à la paie.
 */
export const evenements = pgTable(
  "evenements",
  {
    id: identifiantUnique(),
    code: varchar("code", { length: 3 }).notNull(),
    nom: varchar("nom", { length: 60 }).notNull(),
    type: varchar("type", { length: 10 }).notNull(),
    uniteSaisie: varchar("unite_saisie", { length: 15 }).notNull().default("journee"),
    dureeMinutes: int("duree_minutes"),
    estPrioritaireSurPointages: boolean("est_prioritaire_sur_pointages").notNull().default(false),
    // Vrai : l'événement peut recevoir des droits aux congés (jours acquis, solde).
    estSoumisDroits: boolean("est_soumis_droits").notNull().default(false),
    estVisiblePlanning: boolean("est_visible_planning").notNull().default(true),
    priorite: int("priorite").notNull().default(0),
    codePaie: varchar("code_paie", { length: 20 }),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    uniqueIndex("evenements_code_idx").on(table.code),
    uniqueIndex("evenements_nom_idx").on(sql`lower(${table.nom})`),
    check("evenements_code_valide", sql`${table.code} ~ '^[A-Z0-9]{1,3}$'`),
    check("evenements_nom_non_vide", sql`char_length(trim(${table.nom})) > 0`),
    check("evenements_type_valide", sql`${table.type} IN (${listeSql(TYPES_EVENEMENT)})`),
    check("evenements_priorite_bornee", sql`${table.priorite} BETWEEN 0 AND 255`),
    check("evenements_unite_valide", sql`${table.uniteSaisie} IN (${listeSql(UNITES_SAISIE_EVENEMENT)})`),
    // Une durée seulement pour un événement en heures, et toujours dans ce cas.
    check(
      "evenements_duree_coherente",
      sql`(${table.uniteSaisie} = 'heures' AND ${table.dureeMinutes} BETWEEN 1 AND ${sql.raw(String(DUREE_EVENEMENT_MAX_MINUTES))}) OR (${table.uniteSaisie} <> 'heures' AND ${table.dureeMinutes} IS NULL)`,
    ),
  ],
);

/**
 * Événements attribués aux employés (congé, maladie, formation...) : journées entières du
 * `date_debut` au `date_fin`, ou heures (`debut_minutes` à `fin_minutes`, fin exclue) sur un seul
 * jour. Pas de chevauchement pour un même employé (vérifié dans une transaction qui verrouille
 * les employés). Un événement utilisé ne peut pas être supprimé (`restrict`).
 */
export const evenementsEmployes = pgTable(
  "evenements_employes",
  {
    id: identifiantUnique(),
    employeId: uuid("employe_id")
      .notNull()
      .references(() => employes.id, { onDelete: "cascade" }),
    evenementId: uuid("evenement_id")
      .notNull()
      .references(() => evenements.id, { onDelete: "restrict" }),
    dateDebut: jour("date_debut").notNull(),
    dateFin: jour("date_fin").notNull(),
    // Vides : journées entières.
    debutMinutes: int("debut_minutes"),
    finMinutes: int("fin_minutes"),
    remarque: varchar("remarque", { length: 255 }),
    saisiPar: referenceAuteur("saisi_par"),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    index("evenements_employes_employe_idx").on(table.employeId, table.dateDebut),
    index("evenements_employes_evenement_idx").on(table.evenementId),
    index("evenements_employes_dates_idx").on(table.dateDebut, table.dateFin),
    index("evenements_employes_saisi_par_idx").on(table.saisiPar),
    check("evenements_employes_dates_coherentes", sql`${table.dateFin} >= ${table.dateDebut}`),
    check(
      "evenements_employes_heures_valides",
      sql`(${table.debutMinutes} IS NULL AND ${table.finMinutes} IS NULL) OR (${table.dateDebut} = ${table.dateFin} AND ${table.debutMinutes} >= 0 AND ${table.finMinutes} <= 1440 AND ${table.debutMinutes} < ${table.finMinutes})`,
    ),
  ],
);

const joursDroit = (nom: string) => numeric(nom, { precision: 4, scale: 1, mode: "number" });

/**
 * Droits aux congés : jours acquis par un employé pour un événement (congé payé, récupération...)
 * sur une période. Les absences en journées entières de cet événement les consomment ; les soldes
 * sont calculés à l'affichage, jamais stockés. Pas de chevauchement de périodes pour un même
 * employé et un même événement (vérifié par l'application, dans une transaction).
 * `est_bloquant` : une absence qui rendrait le solde négatif est refusée (« Solde : positif »).
 * `unite_saisie` : valeurs en jours entiers, en demi-journées ou en heures (même colonnes).
 * `supplement_1` à `_3` : jours (ou heures) ajoutés au droit ; total = reliquat + droit + suppléments.
 * `est_confirme` : faux = droit provisoire, ses jours ne sont pas encore utilisables.
 * `est_reporte` : le solde restant en fin de période s'ajoute au droit suivant (calculé à l'affichage).
 */
export const droitsConges = pgTable(
  "droits_conges",
  {
    id: identifiantUnique(),
    employeId: uuid("employe_id")
      .notNull()
      .references(() => employes.id, { onDelete: "cascade" }),
    evenementId: uuid("evenement_id")
      .notNull()
      .references(() => evenements.id, { onDelete: "restrict" }),
    dateDebut: jour("date_debut").notNull(),
    dateFin: jour("date_fin").notNull(),
    joursAcquis: joursDroit("jours_acquis").notNull(),
    joursReliquat: joursDroit("jours_reliquat").notNull().default(0),
    supplement1: joursDroit("supplement_1").notNull().default(0),
    supplement2: joursDroit("supplement_2").notNull().default(0),
    supplement3: joursDroit("supplement_3").notNull().default(0),
    uniteSaisie: varchar("unite_saisie", { length: 15 }).notNull().default("journee"),
    estConfirme: boolean("est_confirme").notNull().default(true),
    estReporte: boolean("est_reporte").notNull().default(false),
    estBloquant: boolean("est_bloquant").notNull().default(false),
    remarque: varchar("remarque", { length: 255 }),
    saisiPar: referenceAuteur("saisi_par"),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    index("droits_conges_employe_idx").on(table.employeId, table.evenementId, table.dateDebut),
    index("droits_conges_evenement_idx").on(table.evenementId),
    index("droits_conges_dates_idx").on(table.dateDebut, table.dateFin),
    index("droits_conges_saisi_par_idx").on(table.saisiPar),
    check("droits_conges_dates_coherentes", sql`${table.dateFin} >= ${table.dateDebut}`),
    // De 0 à 366 jours, par demi-journée.
    check("droits_conges_acquis_valide", sql`${table.joursAcquis} BETWEEN 0 AND 366 AND ${table.joursAcquis} * 2 = floor(${table.joursAcquis} * 2)`),
    check("droits_conges_reliquat_valide", sql`${table.joursReliquat} BETWEEN 0 AND 366 AND ${table.joursReliquat} * 2 = floor(${table.joursReliquat} * 2)`),
    check("droits_conges_supplement_1_valide", sql`${table.supplement1} BETWEEN 0 AND 366 AND ${table.supplement1} * 2 = floor(${table.supplement1} * 2)`),
    check("droits_conges_supplement_2_valide", sql`${table.supplement2} BETWEEN 0 AND 366 AND ${table.supplement2} * 2 = floor(${table.supplement2} * 2)`),
    check("droits_conges_supplement_3_valide", sql`${table.supplement3} BETWEEN 0 AND 366 AND ${table.supplement3} * 2 = floor(${table.supplement3} * 2)`),
    check("droits_conges_unite_valide", sql`${table.uniteSaisie} IN (${listeSql(UNITES_SAISIE_EVENEMENT)})`),
  ],
);

/**
 * Pièces justificatives (PDF ou image), en base comme les photos : jamais publiques, servies
 * seulement aux comptes qui ont la page Droits aux congés. Une même pièce peut justifier les
 * droits de plusieurs employés (attribution groupée) : liens dans `droits_conges_pieces_jointes`.
 */
export const piecesJointes = pgTable(
  "pieces_jointes",
  {
    id: identifiantUnique(),
    nomFichier: varchar("nom_fichier", { length: 150 }).notNull(),
    typeMime: varchar("type_mime", { length: 30 }).notNull(),
    tailleOctets: int("taille_octets").notNull(),
    contenu: binaire("contenu").notNull(),
    ajoutePar: referenceAuteur("ajoute_par"),
    creeLe: dateCreation(),
    modifieLe: dateModification(),
  },
  (table) => [
    index("pieces_jointes_ajoute_par_idx").on(table.ajoutePar),
    check("pieces_jointes_type_mime", sql`${table.typeMime} IN (${listeSql(TYPES_PIECE_JOINTE)})`),
    check("pieces_jointes_taille", sql`${table.tailleOctets} BETWEEN 1 AND ${sql.raw(String(PIECE_JOINTE_TAILLE_MAX_OCTETS))}`),
    check("pieces_jointes_nom_non_vide", sql`char_length(trim(${table.nomFichier})) > 0`),
  ],
);

/** Pièces jointes d'un droit aux congés ; une pièce sans aucun lien est supprimée par l'application. */
export const droitsCongesPiecesJointes = pgTable(
  "droits_conges_pieces_jointes",
  {
    droitId: uuid("droit_id")
      .notNull()
      .references(() => droitsConges.id, { onDelete: "cascade" }),
    pieceJointeId: uuid("piece_jointe_id").notNull(),
    creeLe: dateCreation(),
  },
  (table) => [
    primaryKey({ name: "droits_conges_pieces_jointes_pkey", columns: [table.droitId, table.pieceJointeId] }),
    // Nom court : le nom automatique dépasse les 63 caractères permis par PostgreSQL.
    foreignKey({ name: "droits_conges_pj_piece_fk", columns: [table.pieceJointeId], foreignColumns: [piecesJointes.id] }).onDelete("cascade"),
    index("droits_conges_pieces_jointes_piece_idx").on(table.pieceJointeId),
  ],
);
