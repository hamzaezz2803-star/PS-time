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

/** Grandes parties de l'application (menu, tableau de bord, notifications). */
export const MODULES = ["personnel", "planning", "presence"] as const;
/**
 * Pages qu'un super administrateur peut accorder une par une à un administrateur, rangées
 * par module dans l'ordre du menu. Même liste que la contrainte de la base (`autorisations_pages`).
 */
export const PAGES_PAR_MODULE = {
  personnel: ["sites", "departements", "postes", "personnes"],
  planning: ["profils_horaires", "rotations", "groupes", "affectations", "horaire_dynamique", "rapport_presences"],
  presence: ["pointages_manuels", "evenements", "absences", "droits_conges", "compteurs", "detail_jour"],
} as const;
export const PAGES = [...PAGES_PAR_MODULE.personnel, ...PAGES_PAR_MODULE.planning, ...PAGES_PAR_MODULE.presence] as const;
export const CHEMIN_UTILISATEURS = "/administration/utilisateurs";
export const CHEMIN_APPARENCE = "/administration/apparence";
/** Apparence de l'application, choisie par le super administrateur (même liste que la base). */
export const THEMES = ["bleu", "emeraude", "ocean", "ardoise", "personnalise"] as const;
export const POLICES = ["hanken", "inter", "source_sans", "atkinson"] as const;
/** Taille de tout le texte de l'application (taille de base de la page). */
export const TAILLES_TEXTE = ["normale", "grande", "tres_grande"] as const;
export const THEME_PAR_DEFAUT = "bleu";
export const POLICE_PAR_DEFAUT = "hanken";
export const TAILLE_TEXTE_PAR_DEFAUT = "normale";
/** Couleurs que le thème « Personnalisé » laisse choisir ; les autres nuances en sont déduites. */
export const COULEURS_PERSONNALISABLES = ["primaire", "marine", "accent", "fond"] as const;
/** Point de départ du thème personnalisé : les couleurs du thème Bleu PS Time (mêmes valeurs que globals.css). */
export const COULEURS_PERSONNALISEES_PAR_DEFAUT = { primaire: "#0b4fb3", marine: "#0a2463", accent: "#1aa3e8", fond: "#f6f9fd" } as const;
/** Texte secondaire des pages (même valeur que globals.css), pour vérifier sa lisibilité sur le fond choisi. */
export const COULEUR_TEXTE_SECONDAIRE = "#55627c";
/** Contraste minimal du texte courant (WCAG AA). */
export const CONTRASTE_MIN_TEXTE = 4.5;
export const LONGUEUR_MAX_NOM_UTILISATEUR = 100;
export const LIMITE_UTILISATEURS = 500;

/** Pages accessibles uniquement après connexion. */
export const CHEMIN_CONNEXION = "/connexion";
/** Ajouté à l'adresse de connexion après un changement de mot de passe (message de confirmation). */
export const PARAMETRE_MOT_DE_PASSE_CHANGE = "motDePasseChange";
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

/** Module Programme (profils horaires, rotations, groupes, affectations). */
export const CHEMIN_PROFILS_HORAIRES = "/programme/profils-horaires";
/** Profil horaire : code de 3 caractères au plus (lettres et chiffres), 24 plages au plus. */
export const LONGUEUR_MAX_CODE_PROFIL = 3;
export const PLAGES_PAR_PROFIL_MAX = 24;
export const TYPES_PROFIL = ["travail", "repos"] as const;
/** Borne des durées de repas saisies (minutes). */
export const REPAS_MAX_MINUTES = 720;
export const CHEMIN_GROUPES = "/programme/groupes";
export const CHEMIN_ROTATIONS = "/programme/rotations";
export const CHEMIN_AFFECTATIONS = "/programme/affectations";
export const CHEMIN_HORAIRE_DYNAMIQUE = "/programme/horaire-dynamique";
export const LONGUEUR_MAX_NOM_PROGRAMME = 60;
export const LONGUEUR_MAX_DESCRIPTION_GROUPE = 255;
/** Garde-fou de lecture pour les listes du module (quelques dizaines en pratique). */
export const LIMITE_LISTE_PROGRAMME = 500;
/** Employés proposés dans le choix des membres d'un groupe. */
export const LIMITE_EMPLOYES_SELECTION = 2000;
export const TYPES_ROTATION = ["hebdomadaire", "cycle"] as const;
export const JOURS_ROTATION_MAX = 31;
export const JOURS_PAR_SEMAINE = 7;

/** Gestion des exceptions : pointages saisis à la main (corrections, tests). */
export const CHEMIN_POINTAGES_MANUELS = "/exceptions/pointages-manuels";
/** États d'un pointage, dans l'ordre d'une journée. */
export const ETATS_POINTAGE = ["entree", "sortie", "debut_pause", "fin_pause", "debut_heures_sup", "fin_heures_sup"] as const;
export const SOURCES_POINTAGE = ["manuel", "badgeuse"] as const;
export const POINTAGES_PAR_PAGE = 50;
/**
 * Événements : motifs d'absence ou de présence (congé, maladie, formation, mission...).
 * Code de 3 caractères au plus, priorité de 0 à 255. Saisie à la journée, à la demi-journée
 * ou en heures (durée de 30 min à 24 h, par demi-heure).
 */
export const CHEMIN_EVENEMENTS = "/exceptions/evenements";
export const TYPES_EVENEMENT = ["absence", "presence"] as const;
export const LONGUEUR_MAX_CODE_EVENEMENT = 3;
export const LONGUEUR_MAX_NOM_EVENEMENT = 60;
export const LONGUEUR_MAX_CODE_PAIE = 20;
export const PRIORITE_EVENEMENT_MAX = 255;
export const UNITES_SAISIE_EVENEMENT = ["journee", "demi_journee", "heures"] as const;
export const DUREE_EVENEMENT_MAX_MINUTES = 1440;
export const PAS_DUREE_EVENEMENT_MINUTES = 30;
export const LIMITE_EVENEMENTS = 500;
/**
 * Absences et événements des employés : un événement attribué à un ou plusieurs employés,
 * en journées entières (du ... au ...) ou en heures sur un seul jour.
 */
export const CHEMIN_ABSENCES = "/exceptions/absences";
export const ABSENCES_PAR_PAGE = 50;
/** Une saisie couvre au plus un an (366 jours), bornes comprises. */
export const DUREE_MAX_ABSENCE_JOURS = 366;
export const LONGUEUR_MAX_REMARQUE_ABSENCE = 255;
/**
 * Droits aux congés (d'après la « Gestion des droits » de Gestor, simplifiée) : pour un employé,
 * un événement et une période, des jours acquis ; les absences saisies les consomment.
 */
export const CHEMIN_DROITS_CONGES = "/presence/droits-conges";
export const DROITS_CONGES_PAR_PAGE = 50;
/** Jours acquis ou reliquat : de 0 à 366, par demi-journée (même borne que la base). */
export const JOURS_DROIT_MAX = 366;
export const LONGUEUR_MAX_REMARQUE_DROIT = 255;
/** Nombre maximal d'employés pointés en une seule saisie. */
export const LIMITE_EMPLOYES_POINTAGE = 500;
/** Cloche de notifications : nombre affiché, actualisation, durée de conservation. */
export const NOTIFICATIONS_AFFICHEES_MAX = 30;
export const INTERVALLE_NOTIFICATIONS_MS = 30_000;
export const CONSERVATION_NOTIFICATIONS_JOURS = 90;
export const LONGUEUR_MAX_LIBELLE_NOTIFICATION = 150;
/**
 * Historique (traçabilité) : toutes les actions de tous les comptes, visible par le super
 * administrateur. Gardé plus longtemps que les notifications ; même liste que la base.
 */
export const CHEMIN_HISTORIQUE = "/administration/historique";
export const ACTIONS_HISTORIQUE = ["creation", "modification", "suppression", "connexion", "deconnexion", "export"] as const;
export const MODULES_HISTORIQUE = ["personnel", "planning", "presence", "administration"] as const;
export const CONSERVATION_HISTORIQUE_JOURS = 365;
export const HISTORIQUE_PAR_PAGE = 50;
export const HISTORIQUE_JOURS_DEFAUT = 30;
export const HISTORIQUE_JOURS_MAX = 366;
export const LONGUEUR_MAX_REMARQUE_POINTAGE = 255;
/** Un pointage manuel ne peut pas être dans le futur (petite marge pour l'horloge du poste). */
export const TOLERANCE_POINTAGE_FUTUR_MINUTES = 5;
/** Formules des compteurs : longueur, profondeur d'imbrication et nombre d'éléments maximum. */
export const FORMULE_LONGUEUR_MAX = 2000;
export const FORMULE_PROFONDEUR_MAX = 40;
export const FORMULE_NOEUDS_MAX = 500;
/** ROUND(x, n) : nombre de décimales accepté. */
export const FORMULE_DECIMALES_MAX = 10;
/** Compteurs : nombre maximal de jours chargés en une fois (une période d'historique). */
export const COMPTEURS_JOURS_MAX = 62;
/** Statistiques de présence du tableau de bord : périodes proposées (jours, aujourd'hui compris) et plafond d'employés. */
export const STATISTIQUES_PERIODES = [7, 14, 30] as const;
export const STATISTIQUES_PERIODE_DEFAUT = 7;
export const STATISTIQUES_EMPLOYES_MAX = 2000;
/** Nombre de départements affichés dans le graphique ; les autres sont regroupés. */
export const STATISTIQUES_DEPARTEMENTS_MAX = 8;
export const CHEMIN_COMPTEURS = "/presence/compteurs";
export const LIMITE_COMPTEURS = 500;
export const LONGUEUR_MAX_LIBELLE_COMPTEUR = 100;
export const LONGUEUR_MAX_DESCRIPTION_COMPTEUR = 500;
export const CHEMIN_DETAIL_JOUR = "/presence/detail-jour";
/** Détail jour : pointages affichés au plus, et longueurs d'historique proposées (jours). */
export const DETAIL_POINTAGES_MAX = 200;
export const DUREES_HISTORIQUE = [7, 14, 30] as const;
/** Rapport des présences (horaire dynamique) : chemins, période par défaut et maximale, lignes au plus. */
export const CHEMIN_RAPPORT_PRESENCES = "/programme/rapport-presences";
export const CHEMIN_EXPORT_RAPPORT_PRESENCES = "/programme/rapport-presences/export-excel";
export const CHEMIN_IMPRESSION_RAPPORT_PRESENCES = "/impression/rapport-presences";
export const RAPPORT_JOURS_DEFAUT = 30;
export const RAPPORT_JOURS_MAX = 93;
export const RAPPORT_LIGNES_MAX = 5000;
/** Sauvegarde (Administration > Sauvegarde) : fichier SQL signé, produit et relu par l'application. */
export const CHEMIN_SAUVEGARDE = "/administration/sauvegarde";
export const CHEMIN_EXPORT_SAUVEGARDE = "/administration/sauvegarde/export";
export const CHEMIN_IMPORT_SAUVEGARDE = "/administration/sauvegarde/import";
export const FORMAT_SAUVEGARDE = 1;
/** Jamais sauvegardées : sessions ouvertes et jetons temporaires (on pourrait s'en servir pour se connecter). */
export const TABLES_JAMAIS_SAUVEGARDEES = ["sessions", "verifications"] as const;
/** Comptes de connexion : sauvegardés seulement si la case « comptes » est cochée. */
export const TABLES_COMPTES = ["utilisateurs", "comptes", "autorisations_pages"] as const;
export const TAILLE_MAX_IMPORT_OCTETS = 100 * 1024 * 1024;
export const MOT_CONFIRMATION_IMPORT = "IMPORTER";
export const LIGNES_PAR_LECTURE_SAUVEGARDE = 500;
/** Taille d'une instruction INSERT du fichier (reste sous max_allowed_packet, 16 Mo par défaut). */
export const TAILLE_MAX_INSTRUCTION_SAUVEGARDE = 1_000_000;
