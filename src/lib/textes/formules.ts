/** Messages lisibles des erreurs de formule (compteurs). */
import { FORMULE_DECIMALES_MAX, FORMULE_LONGUEUR_MAX, FORMULE_NOEUDS_MAX, FORMULE_PROFONDEUR_MAX } from "../constantes.ts";
import type { CodeErreurFormule, ErreurFormule } from "../metier/formules/formule.ts";

const ATTENDUS: Record<string, string> = {
  "(": "une parenthèse ouvrante « ( »",
  ")": "une parenthèse fermante « ) »",
  valeur: "un nombre, une variable ou une fonction",
  fin: "la suite de la formule (elle s'arrête trop tôt)",
  fin_attendue: "la fin de la formule (un élément est en trop)",
  comparaison_enchainee: "une seule comparaison à la fois (utilisez AND : A > 1 AND A < 5)",
  nombre: "un nombre",
  booleen: "une condition (vrai ou faux), par exemple RETARD_MIN > 5",
};

const MESSAGES: Record<CodeErreurFormule, (detail: string) => string> = {
  FORMULE_VIDE: () => "Saisissez une formule.",
  FORMULE_TROP_LONGUE: () => `La formule est trop longue (${FORMULE_LONGUEUR_MAX} caractères au maximum).`,
  FORMULE_TROP_PROFONDE: () => `La formule a trop de niveaux imbriqués (${FORMULE_PROFONDEUR_MAX} au maximum).`,
  FORMULE_TROP_COMPLEXE: () => `La formule est trop complexe (${FORMULE_NOEUDS_MAX} éléments au maximum).`,
  CARACTERE_INVALIDE: (detail) => `Le caractère « ${detail} » n'est pas permis.`,
  NOMBRE_INVALIDE: (detail) => `« ${detail} » n'est pas un nombre valide (le séparateur décimal est le point : 1.5).`,
  SYNTAXE: (detail) => `Formule incomplète ou mal écrite : on attendait ${ATTENDUS[detail] ?? detail}.`,
  VARIABLE_INCONNUE: (detail) => `La variable « ${detail} » n'existe pas pour cette périodicité.`,
  FONCTION_INCONNUE: (detail) => `La fonction « ${detail} » n'existe pas.`,
  NOMBRE_ARGUMENTS: (detail) => `La fonction ${detail} n'a pas le bon nombre de valeurs entre parenthèses.`,
  TYPE_INCORRECT: (detail) => `Ici, on attendait ${ATTENDUS[detail] ?? detail}.`,
  RESULTAT_NON_NUMERIQUE: () => "Le résultat doit être un nombre, pas une condition. Utilisez IF(condition, 1, 0).",
  DONNEE_MANQUANTE: () => "Donnée manquante : le calcul est impossible.",
  DIVISION_PAR_ZERO: () => "Division par zéro : le calcul est impossible.",
  ARGUMENT_INVALIDE: () => `ROUND attend un nombre entier de décimales, de 0 à ${FORMULE_DECIMALES_MAX}.`,
  VALEUR_INVALIDE: () => "Le résultat est trop grand pour être calculé.",
};

/** Message complet : explication, variables manquantes, et position (comptée à partir de 1). */
export function messageErreurFormule(erreur: ErreurFormule): string {
  const parties = [MESSAGES[erreur.code](erreur.detail ?? "")];
  if (erreur.variables && erreur.variables.length > 0) parties.push(`Sans valeur : ${erreur.variables.join(", ")}.`);
  if (erreur.position !== undefined) parties.push(`(caractère ${erreur.position + 1})`);
  return parties.join(" ");
}

/** Aide de l'éditeur : fonctions (texte inséré, syntaxe, explication). */
export const AIDE_FONCTIONS = [
  { nom: "IF", insertion: "IF(, , )", syntaxe: "IF(condition, si vrai, si faux)", description: "Choisit une valeur selon une condition." },
  { nom: "MIN", insertion: "MIN(, )", syntaxe: "MIN(a, b, ...)", description: "La plus petite valeur." },
  { nom: "MAX", insertion: "MAX(, )", syntaxe: "MAX(a, b, ...)", description: "La plus grande valeur." },
  { nom: "ABS", insertion: "ABS()", syntaxe: "ABS(x)", description: "Valeur sans signe." },
  { nom: "ROUND", insertion: "ROUND(, 0)", syntaxe: "ROUND(x, décimales)", description: "Arrondi (0 à 10 décimales)." },
  { nom: "FLOOR", insertion: "FLOOR()", syntaxe: "FLOOR(x)", description: "Arrondi vers le bas." },
  { nom: "CEIL", insertion: "CEIL()", syntaxe: "CEIL(x)", description: "Arrondi vers le haut." },
  { nom: "COALESCE", insertion: "COALESCE(, 0)", syntaxe: "COALESCE(a, b, ...)", description: "Première valeur connue : remplace une donnée manquante." },
] as const;

/** Aide de l'éditeur : opérateurs et mots-clés. */
export const AIDE_OPERATEURS = [
  { symbole: "+", description: "addition" },
  { symbole: "-", description: "soustraction" },
  { symbole: "*", description: "multiplication" },
  { symbole: "/", description: "division" },
  { symbole: ">", description: "plus grand" },
  { symbole: ">=", description: "plus grand ou égal" },
  { symbole: "<", description: "plus petit" },
  { symbole: "<=", description: "plus petit ou égal" },
  { symbole: "=", description: "égal" },
  { symbole: "!=", description: "différent" },
  { symbole: "AND", description: "et" },
  { symbole: "OR", description: "ou" },
  { symbole: "NOT", description: "non" },
] as const;
