/** Longueur maximale d'une adresse e-mail (RFC 5321). */
export const LONGUEUR_MAX_EMAIL = 254;

/** Bornes des mots de passe (la borne haute est aussi celle de Better Auth). */
export const LONGUEUR_MIN_MOT_DE_PASSE = 10;
export const LONGUEUR_MAX_MOT_DE_PASSE = 128;

/** Une session dure une journée de travail, prolongée à chaque heure d'activité. */
export const DUREE_SESSION_SECONDES = 12 * 60 * 60;
export const PROLONGATION_SESSION_SECONDES = 60 * 60;

/** Limite des tentatives de connexion par adresse IP. */
export const TENTATIVES_CONNEXION_MAX = 5;
export const FENETRE_TENTATIVES_SECONDES = 60;

/** Identifiant de connexion : lettres minuscules, chiffres, « . », « - », « _ ». */
export const LONGUEUR_MIN_IDENTIFIANT = 3;
export const LONGUEUR_MAX_IDENTIFIANT = 50;
export const FORMAT_IDENTIFIANT = /^[a-z0-9._-]+$/;
/** La connexion se fait par identifiant : l'e-mail exigé par Better Auth est interne, jamais utilisé. */
export const DOMAINE_EMAIL_INTERNE = "utilisateurs.ps-time.invalid";

/**
 * Compte d'installation : « pstime » + mot de passe du jour (lib/metier/mot-de-passe-du-jour.ts).
 * Valable seulement tant qu'aucun utilisateur n'existe ; il ouvre la création du premier
 * administrateur, sans ouvrir de session.
 */
export const IDENTIFIANT_INSTALLATION = "pstime";
export const DUREE_JETON_INSTALLATION_SECONDES = 10 * 60;
/** Plafond commun à toutes les adresses IP : le mot de passe du jour n'a que 10 000 valeurs. */
export const TENTATIVES_INSTALLATION_MAX_PAR_JOUR = 30;
export const UN_JOUR_MILLISECONDES = 24 * 60 * 60 * 1000;

/**
 * Modules qu'un super administrateur peut confier à un administrateur :
 * personnel (sites, départements, postes, personnes), planning (calendriers, rotations,
 * groupes, affectations), présence (pointages). Même liste que la contrainte de la base.
 */
export const MODULES = ["personnel", "planning", "presence"] as const;
export const CHEMIN_UTILISATEURS = "/administration/utilisateurs";
export const LONGUEUR_MAX_NOM_UTILISATEUR = 100;
export const LIMITE_UTILISATEURS = 500;

/** Pages accessibles uniquement après connexion. */
export const CHEMIN_CONNEXION = "/connexion";
export const CHEMIN_ESPACE = "/espace";
export const CHEMIN_CHANGER_MOT_DE_PASSE = "/changer-mot-de-passe";
export const CHEMIN_DEPARTEMENTS = "/personnel/departements";

/** Sites (entreprises ou établissements) gérés par l'installation. */
export const CHEMIN_SITES = "/personnel/sites";
export const LIMITE_SITES = 500;
export const LONGUEUR_MAX_NOM_SITE = 100;
export const LONGUEUR_MAX_ADRESSE_SITE = 255;

/** Garde-fou de lecture : une entreprise a rarement plus de quelques dizaines de départements. */
export const LIMITE_DEPARTEMENTS = 1000;
export const LONGUEUR_MAX_NOM_DEPARTEMENT = 100;

/** Fuseau d'affichage par défaut au Maroc (les dates sont stockées en UTC). */
export const FUSEAU_HORAIRE = "Africa/Casablanca";
export const LANGUE_FORMATS = "fr-FR";

export const CHEMIN_POSTES = "/personnel/postes";
export const LIMITE_POSTES = 1000;
export const LONGUEUR_MAX_CODE_POSTE = 30;
export const LONGUEUR_MAX_NOM_POSTE = 100;
/** Ordre d'affichage d'un poste : le plus petit apparaît en premier ; par défaut, en dernier. */
export const ORDRE_POSTE_MIN = 0;
export const ORDRE_POSTE_MAX = 99999;
export const ORDRE_POSTE_DEFAUT = 99999;

export const CHEMIN_PERSONNES = "/personnel/personnes";
export const EMPLOYES_PAR_PAGE = 50;
export const LONGUEUR_MAX_RECHERCHE = 100;
/** Photo de profil : redimensionnée dans le navigateur, puis vérifiée par le serveur. */
export const PHOTO_COTE_PIXELS = 512;
export const PHOTO_QUALITE_WEBP = 0.85;
/** 512 Ko : identique à la contrainte de la base (photos_employes_taille). */
export const PHOTO_TAILLE_MAX_OCTETS = 524_288;
export const CHEMIN_PHOTO_EMPLOYE = (id: string) => `/personnel/personnes/photo/${id}`;
export const CHEMIN_EXPORT_EXCEL_PERSONNES = "/personnel/personnes/export-excel";
export const CHEMIN_IMPRESSION_PERSONNES = "/impression/personnes";
/** Garde-fou : nombre maximal d'employés dans un export (Excel ou PDF). */
export const EXPORT_EMPLOYES_MAX = 10000;
export const LONGUEUR_MAX_MATRICULE = 30;
export const LONGUEUR_MAX_NOM_EMPLOYE = 100;
/** Indicatif ajouté aux numéros saisis au format national (06..., 07..., 05...). */
export const INDICATIF_PAYS = "212";
export const TYPES_EMPLOI = ["cdi", "cdd", "interim", "stage"] as const;

/** Champs facultatifs créés par l'administrateur. */

export const LONGUEUR_MAX_NUMERO_BADGE = 30;
export const GENRES = ["homme", "femme"] as const;
/** Pièce d'identité : utile à la déclaration CNSS (obligation de l'employeur). */
export const TYPES_PIECE_IDENTITE = ["cin", "passeport", "carte_sejour"] as const;
export const LONGUEUR_MAX_NUMERO_PIECE = 30;
/** Informations supplémentaires propres à un employé (libellé + valeur). */
export const LIMITE_INFORMATIONS_EMPLOYE = 20;
export const LONGUEUR_MAX_LIBELLE_INFORMATION = 60;
export const LONGUEUR_MAX_VALEUR_INFORMATION = 255;

/** Module Programme (calendriers, groupes, rotations, affectations). */
export const CHEMIN_CALENDRIERS = "/programme/calendriers";
export const CHEMIN_GROUPES = "/programme/groupes";
export const CHEMIN_ROTATIONS = "/programme/rotations";
export const CHEMIN_AFFECTATIONS = "/programme/affectations";
export const LONGUEUR_MAX_NOM_PROGRAMME = 60;
export const LONGUEUR_MAX_DESCRIPTION_GROUPE = 255;
/** Garde-fou de lecture pour les listes du module (quelques dizaines en pratique). */
export const LIMITE_LISTE_PROGRAMME = 500;
/** Employés proposés dans le choix des membres d'un groupe. */
export const LIMITE_EMPLOYES_SELECTION = 2000;
export const FENETRE_POINTAGE_MAX_MINUTES = 720;
export const TOLERANCE_MAX_MINUTES = 240;
export const HEURES_SUP_MAX_MINUTES = 1440;
export const TYPES_ROTATION = ["hebdomadaire", "cycle"] as const;
export const JOURS_ROTATION_MAX = 31;
export const JOURS_PAR_SEMAINE = 7;
/** Valeurs proposées pour un nouveau calendrier (journée de 08:00 à 17:00, pause de 12:00 à 13:00). */
export const CALENDRIER_PAR_DEFAUT = {
  debutMinutes: 480,
  finMinutes: 1020,
  pauseDebutMinutes: 720,
  pauseFinMinutes: 780,
  entreeAvantMinutes: 60,
  entreeApresMinutes: 60,
  sortieAvantMinutes: 60,
  sortieApresMinutes: 60,
  retardTolereMinutes: 0,
  departAnticipeTolereMinutes: 0,
  pointageEntreeObligatoire: true,
  pointageSortieObligatoire: true,
  heuresSupActives: false,
  heuresSupApresMinutes: 0,
  heuresSupMinimumMinutes: 30,
  heuresSupMaximumMinutes: 0,
} as const;

/** Gestion des exceptions : pointages saisis à la main (corrections, tests). */
export const CHEMIN_POINTAGES_MANUELS = "/exceptions/pointages-manuels";
/** États d'un pointage, dans l'ordre d'une journée. */
export const ETATS_POINTAGE = ["entree", "sortie", "debut_pause", "fin_pause", "debut_heures_sup", "fin_heures_sup"] as const;
export const SOURCES_POINTAGE = ["manuel", "badgeuse"] as const;
export const POINTAGES_PAR_PAGE = 50;
/** Nombre maximal d'employés pointés en une seule saisie. */
export const LIMITE_EMPLOYES_POINTAGE = 500;
export const LONGUEUR_MAX_REMARQUE_POINTAGE = 255;
/** Un pointage manuel ne peut pas être dans le futur (petite marge pour l'horloge du poste). */
export const TOLERANCE_POINTAGE_FUTUR_MINUTES = 5;
