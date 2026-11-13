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
