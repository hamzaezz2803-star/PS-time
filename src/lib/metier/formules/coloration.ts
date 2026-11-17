/**
 * Découpage tolérant d'une formule pour la coloration dans l'éditeur : ne lève jamais d'erreur
 * (une formule en cours de saisie est souvent incomplète). Le texte des morceaux, mis bout à
 * bout, redonne exactement la formule.
 */
import { FONCTIONS } from "./typage.ts";

export type TypeMorceau = "texte" | "nombre" | "variable" | "variable_inconnue" | "fonction" | "mot_cle" | "operateur" | "invalide";
export type Morceau = { texte: string; type: TypeMorceau };

const MOTS_CLES = new Set(["AND", "OR", "NOT", "TRUE", "FALSE"]);
const MOTIF = /(\s+)|(\d+(?:\.\d+)?|\.\d+)|([A-Za-z_][A-Za-z0-9_]*)|(>=|<=|==|!=|<>|[-+*/><=])|([(),])|([\s\S])/g;

function typeDuNom(nom: string, variables: ReadonlySet<string>): TypeMorceau {
  const majuscules = nom.toUpperCase();
  if (MOTS_CLES.has(majuscules)) return "mot_cle";
  if (FONCTIONS[majuscules]) return "fonction";
  return variables.has(majuscules) ? "variable" : "variable_inconnue";
}

/** Morceaux colorés de la formule ; `variables` : noms connus, en majuscules. */
export function colorerFormule(formule: string, variables: ReadonlySet<string>): Morceau[] {
  const morceaux: Morceau[] = [];
  for (const [texte, espace, nombre, nom, operateur, ponctuation] of formule.matchAll(MOTIF)) {
    const type: TypeMorceau = espace || ponctuation ? "texte" : nombre ? "nombre" : nom ? typeDuNom(nom, variables) : operateur ? "operateur" : "invalide";
    morceaux.push({ texte, type });
  }
  return morceaux;
}
