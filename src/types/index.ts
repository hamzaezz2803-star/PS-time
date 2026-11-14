/** Résultat explicite d'une opération qui peut échouer. */
export type Resultat<T> = { ok: true; donnees: T } | { ok: false; erreur: string };

export type IdentifiantsConnexion = {
  email: string;
  motDePasse: string;
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

export type EtatFormulaireDepartement = EtatFormulaire<"nom" | "parentId">;
export type EtatFormulairePoste = EtatFormulaire<"code" | "nom" | "ordre" | "parentId">;

/** Poste (fonction) : élément d'arbre avec un numéro unique et un ordre d'affichage. */
export type Poste = {
  id: string;
  code: string;
  nom: string;
  ordre: number;
  parentId: string | null;
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
  genre: string | null;
  typePieceIdentite: string | null;
  numeroPieceIdentite: string | null;
  telephone: string | null;
  email: string | null;
  typeEmploi: string | null;
  dateEmbauche: string | null;
  dateDebutEmploi: string | null;
  dateFinEmploi: string | null;
  informations: { libelle: string; valeur: string }[];
};

/** Calendrier (créneau horaire) : heures en minutes depuis minuit. */
export type Calendrier = {
  id: string;
  nom: string;
  debutMinutes: number;
  finMinutes: number;
  pauseMinutes: number;
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
  groupeId: string | null;
};

export type Rotation = {
  id: string;
  nom: string;
  type: "hebdomadaire" | "cycle";
  nombreJours: number;
  /** Calendrier de chaque jour travaillé (numéro du jour → identifiant) ; absent = repos. */
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
