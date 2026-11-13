/** Résultat explicite d'une opération qui peut échouer. */
export type Resultat<T> = { ok: true; donnees: T } | { ok: false; erreur: string };

export type IdentifiantsConnexion = {
  email: string;
  motDePasse: string;
};

export type ErreursChampsConnexion = Partial<
  Record<keyof IdentifiantsConnexion, string>
>;

/** État renvoyé par l'action de connexion au formulaire. Ne contient jamais le mot de passe. */
export type EtatConnexion = {
  email: string;
  erreursChamps?: ErreursChampsConnexion;
  message?: string;
};
