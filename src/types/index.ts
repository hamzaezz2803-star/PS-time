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
  modules: ("personnel" | "planning" | "presence")[];
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
