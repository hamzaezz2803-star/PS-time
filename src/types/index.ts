import type { Page } from "@/lib/metier/droits";
import type { ActionHistorique, ModuleHistorique, ObjetHistorique } from "@/lib/metier/historique";

/** Résultat explicite d'une opération qui peut échouer. */
export type Resultat<T> = { ok: true; donnees: T } | { ok: false; erreur: string };

export type IdentifiantsConnexion = {
  identifiant: string;
  motDePasse: string;
};

/** Réponse de la vérification « pstime » + mot de passe du jour (jamais de mot de passe). */
export type ResultatCodeInstallation = { ok: true; jeton: string } | { ok: false; message: string };

/** État de la fenêtre de création du premier compte. */
export type EtatPremierCompte = {
  erreursChamps?: Record<string, string>;
  message?: string;
  /** Identifiant saisi, réaffiché après une erreur (les mots de passe ne sont jamais renvoyés). */
  identifiantSaisi?: string;
  /** Identifiant créé, pré-rempli ensuite dans l'écran de connexion. */
  identifiantCree?: string;
};

export type ErreursChampsConnexion = Partial<
  Record<keyof IdentifiantsConnexion, string>
>;

export type ChangementMotDePasse = {
  actuel: string;
  nouveau: string;
  confirmation: string;
};

/** État renvoyé au formulaire de changement de mot de passe. Ne contient jamais de mot de passe. */
export type EtatChangementMotDePasse = {
  erreursChamps?: Partial<Record<keyof ChangementMotDePasse, string>>;
  message?: string;
};

/** État renvoyé par les formulaires d'un arbre (départements, postes...). */
export type EtatFormulaire<Champ extends string = string> = {
  erreursChamps?: Partial<Record<Champ, string>>;
  message?: string;
  /** Message de réussite, et identifiant de l'élément à sélectionner ensuite. */
  succes?: { message: string; idSelectionne: string | null };
};

export type EtatFormulaireDepartement = EtatFormulaire<"nom" | "parentId" | "siteId">;
export type EtatFormulairePoste = EtatFormulaire<"code" | "nom" | "ordre" | "parentId" | "siteId">;

/** Ligne de l'historique (traçabilité) : qui a fait quoi, sur quel élément, dans quel module, et quand. */
export type EntreeHistorique = {
  id: string;
  action: ActionHistorique;
  objet: ObjetHistorique;
  module: ModuleHistorique;
  libelle: string | null;
  lien: string | null;
  auteurId: string | null;
  auteurNom: string;
  auteurIdentifiant: string | null;
  creeLe: Date;
};

/** Notification de la cloche : qui a fait quoi, sur quel élément, et quand. */
export type Notification = {
  id: string;
  action: "creation" | "modification" | "suppression";
  objet: "site" | "departement" | "poste" | "employe" | "profil_horaire" | "rotation" | "groupe" | "affectation" | "regle_horaire" | "horaire_dynamique" | "pointage" | "pointage_distance" | "evenement" | "absence" | "droit_conge" | "compteur" | "utilisateur" | "mot_de_passe" | "apparence" | "entreprise";
  libelle: string | null;
  lien: string | null;
  auteurId: string | null;
  auteurNom: string;
  creeLe: Date;
};

/** Pointage affiché en direct sur le tableau de bord (jamais de pièce d'identité ni de contact). */
/** Ligne de la gestion des utilisateurs (jamais de mot de passe ni d'e-mail interne). */
export type UtilisateurListe = {
  id: string;
  /** Identifiant, repris comme nom affiché dans les titres de fenêtre. */
  nom: string;
  identifiant: string;
  nomComplet: string;
  estSuperAdmin: boolean;
  estActif: boolean;
  doitChangerMotDePasse: boolean;
  modifieLe: Date;
  pages: Page[];
};

/** Site (entreprise ou établissement), avec le nombre d'éléments qui y sont rattachés. */
export type Site = {
  id: string;
  nom: string;
  adresse: string | null;
  nombreDepartements: number;
  nombrePostes: number;
  nombreEmployes: number;
};

/** Département : élément d'arbre, rattaché ou non à un site. */
export type Departement = {
  id: string;
  nom: string;
  parentId: string | null;
  siteId: string | null;
};

/** Poste (fonction) : élément d'arbre avec un numéro unique et un ordre d'affichage. */
export type Poste = {
  id: string;
  code: string;
  nom: string;
  ordre: number;
  parentId: string | null;
  siteId: string | null;
};

export type TypeEmploi = "cdi" | "cdd" | "interim" | "stage";
/** Ligne de la liste des employés (dates au format AAAA-MM-JJ). */
export type EmployeListe = {
  id: string;
  matricule: string;
  numeroBadge: string;
  prenom: string;
  nom: string;
  departement: string;
  poste: string | null;
  telephone: string | null;
  dateEmbauche: string | null;
  /** Date de la photo de profil (sert à rafraîchir l'image), null sans photo. */
  photoModifieeLe: Date | null;
};

/**
 * État du formulaire d'employé. Les clés des erreurs sont les noms des champs
 * (`matricule`, `information_<n>_libelle`...). `valeurs` réaffiche la saisie après une erreur.
 */
export type EtatFormulaireEmploye = {
  erreursChamps?: Record<string, string | undefined>;
  message?: string;
  succes?: string;
  valeurs?: Record<string, string>;
  /** Informations supplémentaires saisies, réaffichées après une erreur. */
  informations?: { libelle: string; valeur: string }[];
};

/** Fiche complète d'un employé (dates au format AAAA-MM-JJ, téléphone en E.164). */
export type EmployeDetail = {
  id: string;
  matricule: string;
  numeroBadge: string;
  prenom: string;
  nom: string;
  departementId: string;
  departement: string;
  posteId: string | null;
  poste: string | null;
  siteId: string | null;
  site: string | null;
  genre: string | null;
  typePieceIdentite: string | null;
  numeroPieceIdentite: string | null;
  telephone: string | null;
  email: string | null;
  typeEmploi: string | null;
  dateEmbauche: string | null;
  dateDebutEmploi: string | null;
  dateFinEmploi: string | null;
  /** Date de la photo de profil, null sans photo. */
  photoModifieeLe: Date | null;
  /** Pointage à distance et doigts prévus pour l'enrôlement (aucune donnée biométrique). */
  acces: import("@/lib/metier/acces-pointage").AccesPointage;
  /** Compte de connexion actif (pointage à distance), ou null. Jamais le mot de passe. */
  compte: { identifiant: string; motDePasseProvisoire: boolean } | null;
  informations: { libelle: string; valeur: string }[];
};

/** Calendrier (créneau horaire) : heures en minutes depuis minuit. */
export type Calendrier = {
  id: string;
  nom: string;
  debutMinutes: number;
  finMinutes: number;
  /** Pause de … à … (null toutes les deux = pas de pause). */
  pauseDebutMinutes: number | null;
  pauseFinMinutes: number | null;
  entreeAvantMinutes: number;
  entreeApresMinutes: number;
  sortieAvantMinutes: number;
  sortieApresMinutes: number;
  retardTolereMinutes: number;
  departAnticipeTolereMinutes: number;
  pointageEntreeObligatoire: boolean;
  pointageSortieObligatoire: boolean;
  heuresSupActives: boolean;
  heuresSupApresMinutes: number;
  heuresSupMinimumMinutes: number;
  heuresSupMaximumMinutes: number;
};

export type Groupe = {
  id: string;
  nom: string;
  description: string | null;
  /** Identifiants des employés membres. */
  membres: string[];
};

/** Employé proposé dans le choix des membres d'un groupe. */
export type EmployeSelection = {
  id: string;
  nomComplet: string;
  matricule: string;
  departementId: string;
  groupeId: string | null;
};

/**
 * Profil horaire : journée de 00:00 à 24:00 découpée en plages typées (vide pour un repos).
 * `nom` est le libellé affiché (« Journée 8 h ») ; `code` tient en 3 caractères (« J8 »).
 */
export type ProfilHoraire = {
  id: string;
  code: string;
  nom: string;
  type: "travail" | "repos";
  /** Faux : l'employé ne badge pas et est considéré présent. */
  estBadge: boolean;
  /** Durée de la pause repas : minimum et maximum (null = non contrôlé). */
  repasMinimumMinutes: number | null;
  repasMaximumMinutes: number | null;
  plages: { debut: number; fin: number; type: "interdite" | "neutralisee" | "variable" | "fixe" | "repas" | "retard_tolere" }[];
};

export type Rotation = {
  id: string;
  nom: string;
  type: "hebdomadaire" | "cycle";
  nombreJours: number;
  /** Profil horaire de chaque jour (numéro du jour → identifiant) ; absent = repos. */
  jours: Record<number, string>;
};

export type Affectation = {
  id: string;
  /** Nom affiché (cible et rotation), utilisé par les titres et confirmations. */
  nom: string;
  rotationId: string;
  rotation: string;
  groupeId: string | null;
  employeId: string | null;
  cible: string;
  dateDebut: string;
  dateFin: string | null;
};

/** Pointage saisi à la main, tel qu'affiché dans la liste. */
export type PointageListe = {
  id: string;
  employeId: string;
  /** Groupe actuel de l'employé (son affectation de groupe s'applique s'il n'en a pas en propre). */
  groupeId: string | null;
  prenom: string;
  nom: string;
  matricule: string;
  departement: string;
  photoModifieeLe: Date | null;
  /** Instant UTC du pointage. */
  horodatage: Date;
  etat: string;
  remarque: string | null;
  /** Nom du compte qui l'a saisi (null si ce compte a été supprimé). */
  saisiPar: string | null;
};

/** Règle de l'horaire dynamique, telle qu'affichée dans la liste. */
export type RegleHoraireListe = {
  id: string;
  /** Résumé lisible (« De 06:00 à 09:00 : Journée 8 h »), sert au titre et à la recherche. */
  nom: string;
  debut: number;
  fin: number;
  jours: number[];
  profilId: string;
  profilNom: string;
  profilCode: string;
  estActif: boolean;
  couleur: import("@/lib/constantes").CouleurRegle;
};

/** Compteur tel qu'affiché dans la liste et le formulaire. */
export type Compteur = {
  id: string;
  code: string;
  /** Libellé (sert aussi de nom dans la liste commune). */
  nom: string;
  formule: string;
  periodicites: ("JOUR" | "SEMAINE" | "MOIS")[];
  unite: "minutes" | "heures" | "jours" | "nombre" | "pourcentage";
  description: string | null;
  estActif: boolean;
  version: number;
  /** Vrai tant que la formule du pack attend des données que PS Time ne calcule pas encore (activation refusée). */
  estAAdapter: boolean;
  /** Fiche du pack standard ; null pour un compteur créé par le client. */
  pack: FichePackCompteur | null;
};

/** Événement qui donne des variables aux formules : JOURS_<code>, MIN_<code> et, s'il est soumis aux droits, PRIS_<code>, SOLDE_<code>. */
export type CodeEvenementCompteur = { code: string; nom: string; estSoumisDroits: boolean };

/** Explication d'un compteur du pack standard (migration 0007). */
export type FichePackCompteur = {
  numero: number;
  famille: (typeof import("@/lib/constantes").FAMILLES_COMPTEUR)[number];
  fonctionnement: string | null;
  adaptation: string | null;
  remiseAZero: string | null;
};

/** Version passée ou actuelle d'un compteur (historique). */
export type VersionCompteur = {
  version: number;
  formule: string;
  periodicites: ("JOUR" | "SEMAINE" | "MOIS")[];
  unite: string;
  auteur: string | null;
  date: string;
};

/** Valeur d'un compteur prête à afficher : un nombre, ou le message expliquant pourquoi il n'y en a pas. */
export type ValeurAffichee = { idCompteur: string; valeur: number | null; message: string | null };

/** Un jour du Détail jour : résumé (horaire, entrée, sortie, événement retenu) et compteurs journaliers. */
export type JourDetail = import("@/lib/metier/resume-jour").ResumeJour & { valeurs: ValeurAffichee[] };

/** Tout ce que montre l'écran Détail jour pour un employé et une date. */
export type DetailJour = {
  date: string;
  employe: { id: string; nomComplet: string; matricule: string; departement: string };
  horaire: {
    profilCode: string;
    profilNom: string;
    estDynamique: boolean;
    debutPrevu: number;
    finPrevue: number;
    dureePrevue: number;
    entree: number | null;
    sortie: number | null;
  } | null;
  pointages: {
    id: string;
    horodatage: string;
    etat: string;
    /** « badgeuse », « manuel » ou « distance ». */
    source: string;
    remarque: string | null;
    /** Compte qui a saisi un pointage manuel (vide pour la badgeuse ou un compte supprimé). */
    saisiParNom: string | null;
    saisiParIdentifiant: string | null;
    /** Pointage à distance : appareil, position (si exigée) et photo (gardée 90 jours). */
    appareil: string | null;
    position: { latitude: number; longitude: number } | null;
    aPhoto: boolean;
    statut: import("@/lib/metier/statut-pointage").StatutPointage;
  }[];
  /** Absences et événements de l'employé ce jour-là. */
  evenements: EvenementDuJour[];
  compteurs: Compteur[];
  /** Valeurs par périodicité ; un compteur absent n'a pas cette périodicité. */
  valeurs: Record<"JOUR" | "SEMAINE" | "MOIS", ValeurAffichee[]>;
  periodes: Record<"JOUR" | "SEMAINE" | "MOIS", { debut: string; fin: string; finCalcul: string }>;
  /** Valeurs journalières des jours précédents (le plus ancien d'abord), date comprise. */
  /** Chaque jour chargé (historique, semaine et mois de la date), du plus ancien au plus récent. */
  jours: JourDetail[];
  /** Premier jour de l'historique journalier (les jours avant servent à la semaine et au mois). */
  debutHistorique: string;
};

/** Ligne du Rapport des présences : premier pointage d'un employé un jour donné, et horaire reconnu. */
export type LigneRapportPresence = {
  employeId: string;
  matricule: string;
  nomComplet: string;
  departement: string;
  jour: string;
  /** Premier pointage, en minutes depuis minuit (heure de Casablanca). */
  minutes: number;
  /** Profil reconnu et couleur de la règle qui l'a reconnu, ou null. */
  profil: { code: string; nom: string; couleur: import("@/lib/constantes").CouleurRegle } | null;
};

/** Événement : motif d'absence ou de présence (congé, maladie, formation, mission...). */
export type Evenement = {
  id: string;
  code: string;
  nom: string;
  type: "absence" | "presence";
  /** Journée, demi-journée ou heures (seule une saisie en heures accepte des heures dans les absences). */
  uniteSaisie: UniteSaisieEvenement;
  /** Durée prévue d'un événement en heures, en minutes ; vide pour une journée ou une demi-journée. */
  dureeMinutes: number | null;
  /** Vrai : l'événement reste retenu même si l'employé a pointé (ex. formation non badgée). */
  estPrioritaireSurPointages: boolean;
  /** Vrai : l'événement peut recevoir des droits aux congés. */
  estSoumisDroits: boolean;
  /** « Actif » : proposé dans les saisies (Absences et événements) ; « Non actif » sinon. */
  estVisiblePlanning: boolean;
  /** De 0 à 255 : entre deux événements le même jour, le plus grand l'emporte. */
  priorite: number;
  /** Vide : non transmis à la paie. */
  codePaie: string | null;
};

export type UniteSaisieEvenement = "journee" | "demi_journee" | "heures";

/** Ligne de la liste « Absences et événements » : un événement attribué à un employé. */
export type AbsenceListe = {
  id: string;
  employeId: string;
  prenom: string;
  nom: string;
  matricule: string;
  departement: string;
  photoModifieeLe: Date | null;
  evenementCode: string;
  evenementNom: string;
  evenementType: "absence" | "presence";
  debut: string;
  fin: string;
  /** Vides : journées entières. */
  debutMinutes: number | null;
  finMinutes: number | null;
  remarque: string | null;
  saisiPar: string | null;
};

/** Événement d'un employé sur une journée (Détail jour). */
export type EvenementDuJour = {
  code: string;
  nom: string;
  type: "absence" | "presence";
  priorite: number;
  neutralisePointage: boolean;
  /** Journée entière : retenu ce jour-là (priorité, pointages) ou non validé ; null pour une saisie en heures. */
  estValide: boolean | null;
  debut: string;
  fin: string;
  debutMinutes: number | null;
  finMinutes: number | null;
  remarque: string | null;
};

/** Événement proposé dans la saisie des absences (affiché dans le planning). */
export type EvenementSaisissable = { id: string; code: string; nom: string; estSaisiEnHeures: boolean };

/** Absence qui consomme un droit aux congés : jours pris (passés) et prévus (à venir). */
export type AbsenceDuDroit = { id: string; debut: string; fin: string; pris: number; prevus: number; remarque: string | null };

/** Carte de la page « Droits aux congés » : un droit d'un employé, son bilan calculé et ses absences. */
export type DroitCongeListe = {
  id: string;
  employeId: string;
  prenom: string;
  nom: string;
  matricule: string;
  departement: string;
  photoModifieeLe: Date | null;
  evenementId: string;
  evenementCode: string;
  evenementNom: string;
  debut: string;
  fin: string;
  joursAcquis: number;
  joursReliquat: number;
  supplement1: number;
  supplement2: number;
  supplement3: number;
  uniteSaisie: UniteSaisieEvenement;
  /** Faux : droit provisoire (« À confirmer »). */
  estConfirme: boolean;
  /** Vrai : le solde restant passe sur la période suivante. */
  estReporte: boolean;
  /** Vrai : « Solde : positif » (une absence qui le rendrait négatif est refusée). */
  estBloquant: boolean;
  remarque: string | null;
  saisiPar: string | null;
  bilan: { total: number; acquis: number; report: number; pris: number; prevus: number; soldeAujourdhui: number; soldePrevisionnel: number };
  absences: AbsenceDuDroit[];
  piecesJointes: PieceJointeDroit[];
};

/** Pièce justificative d'un droit (sans son contenu, servi par sa propre route). */
export type PieceJointeDroit = { id: string; nomFichier: string; typeMime: string; tailleOctets: number };

/** Événement proposé pour un droit aux congés (événements de type absence). */
export type EvenementDroit = { id: string; code: string; nom: string };

/** Réponse de la route d'import d'une sauvegarde (Administration > Sauvegarde). */
export type ReponseImportSauvegarde = { ok: true; message: string; reconnexion: boolean } | { ok: false; message: string };
