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
