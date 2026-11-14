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

/** Pages accessibles uniquement après connexion. */
export const CHEMIN_CONNEXION = "/connexion";
export const CHEMIN_ESPACE = "/espace";
export const CHEMIN_CHANGER_MOT_DE_PASSE = "/changer-mot-de-passe";
export const CHEMIN_DEPARTEMENTS = "/personnel/departements";

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
