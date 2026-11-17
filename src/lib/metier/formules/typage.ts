/**
 * Contrôle de types d'un arbre de formule, avant tout calcul : variables connues pour la
 * périodicité visée, fonctions existantes avec le bon nombre d'arguments, opérandes du bon type.
 * Toutes les variables sont des nombres (les indicateurs valent 1 ou 0).
 */
import { echec } from "./erreurs.ts";
import type { Noeud } from "./parser.ts";

export type TypeValeur = "nombre" | "booleen";

/** Fonctions disponibles et leur nombre d'arguments (max null = illimité). */
export const FONCTIONS: Record<string, { min: number; max: number | null }> = {
  IF: { min: 3, max: 3 },
  MIN: { min: 1, max: null },
  MAX: { min: 1, max: null },
  ABS: { min: 1, max: 1 },
  ROUND: { min: 1, max: 2 },
  FLOOR: { min: 1, max: 1 },
  CEIL: { min: 1, max: 1 },
  COALESCE: { min: 1, max: null },
};

const ARITHMETIQUES = new Set(["+", "-", "*", "/"]);
const ORDRES = new Set([">", "<", ">=", "<="]);

/** Vérifie que le nœud a le type attendu ; `detail` dit ce qui était attendu. */
function exiger(noeud: Noeud, attendu: TypeValeur, variables: ReadonlySet<string>): void {
  if (typer(noeud, variables) !== attendu) echec("TYPE_INCORRECT", noeud.position, attendu);
}

function typerFonction(noeud: Extract<Noeud, { type: "fonction" }>, variables: ReadonlySet<string>): TypeValeur {
  const definition = FONCTIONS[noeud.nom];
  if (!definition) echec("FONCTION_INCONNUE", noeud.position, noeud.nom);
  const nombre = noeud.arguments.length;
  if (nombre < definition.min || (definition.max !== null && nombre > definition.max)) echec("NOMBRE_ARGUMENTS", noeud.position, noeud.nom);

  if (noeud.nom === "IF") {
    const [condition, siVrai, siFaux] = noeud.arguments;
    exiger(condition, "booleen", variables);
    const type = typer(siVrai, variables);
    exiger(siFaux, type, variables);
    return type;
  }
  if (noeud.nom === "COALESCE") {
    const type = typer(noeud.arguments[0], variables);
    noeud.arguments.slice(1).forEach((argument) => exiger(argument, type, variables));
    return type;
  }
  noeud.arguments.forEach((argument) => exiger(argument, "nombre", variables));
  return "nombre";
}

/** Type d'un nœud ; lève une erreur au premier problème rencontré. */
export function typer(noeud: Noeud, variables: ReadonlySet<string>): TypeValeur {
  switch (noeud.type) {
    case "nombre":
      return "nombre";
    case "booleen":
      return "booleen";
    case "variable":
      if (!variables.has(noeud.nom)) echec("VARIABLE_INCONNUE", noeud.position, noeud.nom);
      return "nombre";
    case "unaire":
      exiger(noeud.operande, noeud.operateur === "NOT" ? "booleen" : "nombre", variables);
      return noeud.operateur === "NOT" ? "booleen" : "nombre";
    case "fonction":
      return typerFonction(noeud, variables);
    case "binaire": {
      const { operateur, gauche, droite } = noeud;
      if (ARITHMETIQUES.has(operateur)) {
        exiger(gauche, "nombre", variables);
        exiger(droite, "nombre", variables);
        return "nombre";
      }
      if (operateur === "AND" || operateur === "OR") {
        exiger(gauche, "booleen", variables);
        exiger(droite, "booleen", variables);
        return "booleen";
      }
      // Comparaisons : nombres pour < > <= >=, même type des deux côtés pour = et !=.
      // Chaque nœud n'est typé qu'une fois (sinon le coût doublerait à chaque niveau d'imbrication).
      const typeGauche = typer(gauche, variables);
      if (ORDRES.has(operateur) && typeGauche !== "nombre") echec("TYPE_INCORRECT", gauche.position, "nombre");
      exiger(droite, typeGauche, variables);
      return "booleen";
    }
  }
}
