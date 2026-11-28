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
export const MODULES = ["personnel", "planning", "presence", "etats"] as const;
/**
 * Pages qu'un super administrateur peut accorder une par une à un administrateur, rangées
 * par module dans l'ordre du menu. Même liste que la contrainte de la base (`autorisations_pages`).
 */
export const PAGES_PAR_MODULE = {
  personnel: ["sites", "departements", "postes", "personnes"],
  planning: ["planning", "profils_horaires", "rotations", "groupes", "affectations", "horaire_dynamique", "rapport_presences"],
  presence: ["pointages_manuels", "evenements", "absences", "droits_conges", "compteurs", "detail_jour"],
  etats: ["etat_presences", "etat_evenements", "etat_conges", "etat_pointages"],
} as const;
export const PAGES = [...PAGES_PAR_MODULE.personnel, ...PAGES_PAR_MODULE.planning, ...PAGES_PAR_MODULE.presence, ...PAGES_PAR_MODULE.etats] as const;
/**
 * Pages retirées du menu et des droits proposés aux administrateurs (23/11/2026 : Absences et
 * événements). La page, ses données et leurs effets (soldes, détail jour) restent : réactivable
 * en la retirant d'ici et en remettant son lien dans le menu.
 */
export const PAGES_MASQUEES: readonly string[] = ["absences"];
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
/** Menus de la barre de navigation : icônes et texte (quand la place le permet), ou texte seul. */
export const MODES_MENU = ["icones", "texte"] as const;
/** Hauteur des lignes des tableaux et des cases du planning (sur tablette et ordinateur). */
export const DENSITES = ["confortable", "compacte"] as const;
/** Couleurs des pages imprimées ou enregistrées en PDF. */
export const MODES_IMPRESSION = ["couleurs", "gris", "noir_blanc"] as const;
export const MODE_MENU_PAR_DEFAUT = "icones";
export const DENSITE_PAR_DEFAUT = "confortable";
export const MODE_IMPRESSION_PAR_DEFAUT = "couleurs";
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
export const ETATS_POINTAGE = [
  "entree",
  "sortie",
  "debut_pause",
  "fin_pause",
  "debut_mission",
  "fin_mission",
  "debut_heures_sup",
  "fin_heures_sup",
] as const;
export const SOURCES_POINTAGE = ["manuel", "badgeuse", "distance"] as const;
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

/** Appareils hors badgeuse depuis lesquels un employé peut être autorisé à pointer. */
export const APPAREILS_POINTAGE = ["pc", "tablette", "telephone"] as const;
export type AppareilPointage = (typeof APPAREILS_POINTAGE)[number];
/**
 * Types de pointage à distance. La présence (entrée, sortie, pauses) est toujours accordée à un
 * employé autorisé ; la mission et les heures supplémentaires sont des droits cochés en plus.
 */
export const DROITS_POINTAGE_DISTANCE = ["mission", "heures_sup"] as const;
export type DroitPointageDistance = (typeof DROITS_POINTAGE_DISTANCE)[number];
export const ETATS_POINTAGE_PRESENCE = ["entree", "sortie", "debut_pause", "fin_pause"] as const;
export const ETATS_PAR_DROIT_POINTAGE: Record<DroitPointageDistance, readonly (typeof ETATS_POINTAGE)[number][]> = {
  mission: ["debut_mission", "fin_mission"],
  heures_sup: ["debut_heures_sup", "fin_heures_sup"],
};

/**
 * Espace de pointage de l'employé (compte créé avec le pointage à distance : identifiant et
 * mot de passe provisoire = son matricule). Photo réduite dans le navigateur, gardée 90 jours.
 */
export const CHEMIN_POINTAGE_EMPLOYE = "/pointage";
export const CHEMIN_PHOTO_POINTAGE = (id: string) => `/presence/detail-jour/photo-pointage/${id}`;
export const PHOTO_POINTAGE_COTE_MAX_PIXELS = 640;
export const PHOTO_POINTAGE_QUALITE_JPEG = 0.8;
export const PHOTO_POINTAGE_TAILLE_MAX_OCTETS = 204_800;
export const CONSERVATION_PHOTOS_POINTAGE_JOURS = 90;
/** Précision GPS acceptée au plus (mètres) : au-delà, la position est trop vague pour être utile. */
export const PRECISION_POSITION_MAX_METRES = 100_000;
/** Délai d'attente de la géolocalisation du navigateur. */
export const DELAI_POSITION_MILLISECONDES = 20_000;
/** Pointages à distance par employé et par minute au plus (double clic, envoi répété). */
export const POINTAGES_DISTANCE_PAR_MINUTE = 3;
/** Zoom de la carte OpenStreetMap : demi-largeur du cadre autour de la position, en degrés. */
export const CARTE_DEMI_CADRE_DEGRES = 0.004;

/**
 * Doigts à enrôler sur la badgeuse, numérotés comme les badgeuses ZKTeco : 0 = auriculaire
 * gauche ... 4 = pouce gauche, 5 = pouce droit ... 9 = auriculaire droit. Aucune empreinte n'est
 * stockée par l'application : seulement la liste des doigts prévus.
 */
export const DOIGTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Doigt = (typeof DOIGTS)[number];
/** Nombre de doigts conseillé (un de secours si le premier est blessé ou mal lu). */
export const DOIGTS_CONSEILLES = 2;

/** Couleurs proposées pour une règle d'horaire dynamique (palette fixe, contrastes vérifiés dans globals.css). */
export const COULEURS_REGLE = ["bleu", "vert", "orange", "rouge", "turquoise", "rose", "jaune", "ardoise"] as const;
export type CouleurRegle = (typeof COULEURS_REGLE)[number];
export const COULEUR_REGLE_DEFAUT: CouleurRegle = "bleu";
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
/**
 * Pièces justificatives d'un droit aux congés : PDF, PNG, JPEG ou WebP (vérifiés par leur
 * signature), 2 Mo chacune, 5 par envoi et 10 par droit au plus. Jamais publiques.
 */
export const CHEMIN_PIECES_JOINTES_DROITS = "/presence/droits-conges/piece-jointe";
export const TYPES_PIECE_JOINTE = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
export const PIECE_JOINTE_TAILLE_MAX_OCTETS = 2_097_152;
export const PIECES_JOINTES_PAR_ENVOI_MAX = 5;
export const PIECES_JOINTES_PAR_DROIT_MAX = 10;
export const LONGUEUR_MAX_NOM_PIECE_JOINTE = 150;
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
/**
 * Pack standard des compteurs (d'après la « Description des compteurs du Pack-Easy » de Gestor) :
 * inséré désactivé à l'installation par la migration 0007. Familles pour le regroupement à l'écran.
 */
export const FAMILLES_COMPTEUR = ["presence", "absences", "heures_sup", "conges", "autres"] as const;
/** Travail de nuit (Code du travail marocain, art. 172 : de 21 h à 6 h), en minutes depuis minuit. */
export const NUIT_DEBUT_MINUTES = 21 * 60;
export const NUIT_FIN_MINUTES = 6 * 60;
export const CHEMIN_DETAIL_JOUR = "/presence/detail-jour";
/** Détail jour : pointages affichés au plus, et longueurs d'historique proposées (jours). */
export const DETAIL_POINTAGES_MAX = 200;
export const DUREES_HISTORIQUE = [7, 14, 30] as const;
/** Rapport des présences (horaire dynamique) : chemins, période par défaut et maximale, lignes au plus. */
export const CHEMIN_RAPPORT_PRESENCES = "/programme/rapport-presences";
/**
 * Consultation > Planning (sur le modèle de Gestor) : planning mensuel ou annuel d'un employé,
 * calculé à l'affichage (horaire prévu, événements, pointages). Une année = 366 jours au plus.
 */
export const CHEMIN_PLANNING = "/consultation/planning";
export const VUES_PLANNING = ["mensuel", "annuel"] as const;
export const CHEMIN_PLANNING_VUE = (vue: (typeof VUES_PLANNING)[number]) => `${CHEMIN_PLANNING}/${vue}`;
export const PLANNING_JOURS_MAX = 366;
export const CHEMIN_EXPORT_RAPPORT_PRESENCES = "/programme/rapport-presences/export-excel";
export const CHEMIN_IMPRESSION_RAPPORT_PRESENCES = "/impression/rapport-presences";
export const RAPPORT_JOURS_DEFAUT = 30;
export const RAPPORT_JOURS_MAX = 93;
export const RAPPORT_LIGNES_MAX = 5000;
/** Menu État : une page par rapport (/etats/presences...), son export Excel et sa version imprimable. */
export const CHEMIN_ETATS = "/etats";
export const CHEMIN_IMPRESSION_ETATS = "/impression/etats";
export const CHEMIN_ETAT = (etat: string) => `${CHEMIN_ETATS}/${etat}`;
export const CHEMIN_EXPORT_ETAT = (etat: string) => `${CHEMIN_ETATS}/${etat}/export-excel`;
export const CHEMIN_IMPRESSION_ETAT = (etat: string) => `${CHEMIN_IMPRESSION_ETATS}/${etat}`;
/** Lignes affichées à l'écran (l'export Excel ou PDF en contient jusqu'à RAPPORT_LIGNES_MAX). */
export const ETAT_LIGNES_ECRAN_MAX = 500;
/** Appareils > Badgeuses : détection sur le réseau local et synchronisation, rien en base. */
export const CHEMIN_APPAREILS = "/appareils";
/** Port réseau des badgeuses ZKTeco (TCP). */
export const PORT_BADGEUSE = 4370;
/** Attente d'une adresse pendant la recherche : une badgeuse du réseau local répond bien plus vite. */
export const DELAI_SONDAGE_BADGEUSE_MS = 700;
/** Attente d'une réponse d'une badgeuse déjà trouvée (connexion, lecture, réglage de l'heure). */
export const DELAI_REPONSE_BADGEUSE_MS = 4000;
/** Adresses essayées en même temps pendant la recherche. */
export const SONDAGES_SIMULTANES = 64;
/** Réseaux du serveur parcourus au plus (cartes réseau privées). */
export const RESEAUX_PARCOURUS_MAX = 4;
export const RECHERCHES_BADGEUSES_PAR_MINUTE = 4;
export const ACTIONS_BADGEUSE_PAR_MINUTE = 30;
/** Au-delà de cet écart, l'heure de la badgeuse est signalée comme à régler. */
export const ECART_HEURE_TOLERE_SECONDES = 60;
/** Sauvegarde (Administration > Sauvegarde) : fichier SQL signé, produit et relu par l'application. */
export const CHEMIN_SAUVEGARDE = "/administration/sauvegarde";
export const CHEMIN_EXPORT_SAUVEGARDE = "/administration/sauvegarde/export";
export const CHEMIN_IMPORT_SAUVEGARDE = "/administration/sauvegarde/import";
/** Format 2 : PostgreSQL. Un fichier au format 1 (ancienne base MySQL) est refusé. */
export const FORMAT_SAUVEGARDE = 2;
/** Jamais sauvegardées : sessions ouvertes et jetons temporaires (on pourrait s'en servir pour se connecter). */
export const TABLES_JAMAIS_SAUVEGARDEES = ["sessions", "verifications"] as const;
/** Comptes de connexion : sauvegardés seulement si la case « comptes » est cochée. */
export const TABLES_COMPTES = ["utilisateurs", "comptes", "autorisations_pages"] as const;
export const TAILLE_MAX_IMPORT_OCTETS = 100 * 1024 * 1024;
export const MOT_CONFIRMATION_IMPORT = "IMPORTER";
export const LIGNES_PAR_LECTURE_SAUVEGARDE = 500;
/** Taille d'une instruction INSERT du fichier (lignes courtes, faciles à relire). */
export const TAILLE_MAX_INSTRUCTION_SAUVEGARDE = 1_000_000;
/** Valeurs par requête d'import (PostgreSQL en accepte 65 535 au plus). */
export const PARAMETRES_MAX_PAR_REQUETE = 60_000;
