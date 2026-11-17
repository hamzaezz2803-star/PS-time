/**
 * Erreurs typées des formules de compteurs : un code, la position dans la formule (index du
 * caractère, à partir de 0) et les détails utiles. Le message lisible est composé par
 * `lib/textes/formules.ts`, pour garder ce module pur.
 */

export const CODES_ERREUR_FORMULE = [
  // Compilation
  "FORMULE_VIDE",
  "FORMULE_TROP_LONGUE",
  "FORMULE_TROP_PROFONDE",
  "FORMULE_TROP_COMPLEXE",
  "CARACTERE_INVALIDE",
  "NOMBRE_INVALIDE",
  "SYNTAXE",
  "VARIABLE_INCONNUE",
  "FONCTION_INCONNUE",
  "NOMBRE_ARGUMENTS",
  "TYPE_INCORRECT",
  "RESULTAT_NON_NUMERIQUE",
  // Calcul
  "DONNEE_MANQUANTE",
  "DIVISION_PAR_ZERO",
  "ARGUMENT_INVALIDE",
  "VALEUR_INVALIDE",
] as const;

export type CodeErreurFormule = (typeof CODES_ERREUR_FORMULE)[number];

export type ErreurFormule = {
  code: CodeErreurFormule;
  /** Index du caractère concerné dans la formule (absent pour une erreur sur l'ensemble). */
  position?: number;
  /** Nom de la variable ou de la fonction, élément attendu, type attendu... */
  detail?: string;
  /** DONNEE_MANQUANTE : variables sans valeur. */
  variables?: string[];
};

/** Erreur levée à l'intérieur du module, convertie en résultat explicite à sa sortie. */
export class EchecFormule extends Error {
  erreur: ErreurFormule;

  constructor(erreur: ErreurFormule) {
    super(erreur.code);
    this.erreur = erreur;
  }
}

export function echec(code: CodeErreurFormule, position?: number, detail?: string): never {
  throw new EchecFormule({ code, ...(position !== undefined && { position }), ...(detail !== undefined && { detail }) });
}
