/**
 * Analyse d'une formule en arbre, par descente récursive. Priorités, de la plus faible à la plus
 * forte : OR, AND, NOT, comparaisons, + -, * /, moins unaire. Les comparaisons ne s'enchaînent pas
 * (« a < b < c » est refusé). Profondeur et nombre d'éléments sont limités.
 */
import { FORMULE_NOEUDS_MAX, FORMULE_PROFONDEUR_MAX } from "../../constantes.ts";
import { echec } from "./erreurs.ts";
import type { Jeton } from "./lexer.ts";

export type OperateurBinaire = "+" | "-" | "*" | "/" | "=" | "!=" | ">" | "<" | ">=" | "<=" | "AND" | "OR";

export type Noeud =
  | { type: "nombre"; valeur: number; position: number }
  | { type: "booleen"; valeur: boolean; position: number }
  | { type: "variable"; nom: string; position: number }
  | { type: "unaire"; operateur: "-" | "NOT"; operande: Noeud; position: number }
  | { type: "binaire"; operateur: OperateurBinaire; gauche: Noeud; droite: Noeud; position: number }
  | { type: "fonction"; nom: string; arguments: Noeud[]; position: number };

const MOTS_RESERVES = new Set(["AND", "OR", "NOT", "TRUE", "FALSE"]);
const COMPARAISONS = new Set(["=", "!=", ">", "<", ">=", "<="]);

/** Construit l'arbre d'une liste de jetons (terminée par « fin »). */
export function analyser(jetons: Jeton[]): Noeud {
  let index = 0;
  let profondeur = 0;
  let noeuds = 0;

  const courant = () => jetons[index];
  const avancer = () => jetons[index++];
  /** Texte du jeton courant s'il s'agit d'un nom ou d'un opérateur, sinon null. */
  const texteCourant = (): string | null => {
    const jeton = courant();
    return jeton.type === "nom" || jeton.type === "operateur" ? jeton.valeur : null;
  };
  const estMot = (mot: string) => courant().type === "nom" && texteCourant() === mot;
  const estOperateur = (...valeurs: string[]) => courant().type === "operateur" && valeurs.includes(texteCourant() ?? "");
  const estComparaison = () => courant().type === "operateur" && COMPARAISONS.has(texteCourant() ?? "");
  /** Consomme le jeton courant et renvoie son texte (opérateur). */
  const prendreOperateur = () => {
    const texte = texteCourant() as OperateurBinaire;
    avancer();
    return texte;
  };

  const creer = (noeud: Noeud): Noeud => {
    noeuds += 1;
    if (noeuds > FORMULE_NOEUDS_MAX) echec("FORMULE_TROP_COMPLEXE", noeud.position);
    return noeud;
  };

  /** Toute imbrication (parenthèses, arguments, opérateurs unaires) compte dans la profondeur. */
  const imbrique = <T>(position: number, lire: () => T): T => {
    profondeur += 1;
    if (profondeur > FORMULE_PROFONDEUR_MAX) echec("FORMULE_TROP_PROFONDE", position);
    const resultat = lire();
    profondeur -= 1;
    return resultat;
  };

  const attendre = (type: Jeton["type"], attendu: string) => {
    if (courant().type !== type) echec("SYNTAXE", courant().position, attendu);
    return avancer();
  };

  const binaire = (operateur: OperateurBinaire, gauche: Noeud, droite: Noeud, position: number) =>
    creer({ type: "binaire", operateur, gauche, droite, position });

  function expression(): Noeud {
    return imbrique(courant().position, ou);
  }

  function ou(): Noeud {
    let gauche = et();
    while (estMot("OR")) {
      avancer();
      gauche = binaire("OR", gauche, et(), gauche.position);
    }
    return gauche;
  }

  function et(): Noeud {
    let gauche = non();
    while (estMot("AND")) {
      avancer();
      gauche = binaire("AND", gauche, non(), gauche.position);
    }
    return gauche;
  }

  function non(): Noeud {
    if (!estMot("NOT")) return comparaison();
    const { position } = avancer();
    return imbrique(position, () => creer({ type: "unaire", operateur: "NOT", operande: non(), position }));
  }

  function comparaison(): Noeud {
    const gauche = addition();
    if (!estComparaison()) return gauche;
    const resultat = binaire(prendreOperateur(), gauche, addition(), gauche.position);
    if (estComparaison()) echec("SYNTAXE", courant().position, "comparaison_enchainee");
    return resultat;
  }

  function addition(): Noeud {
    let gauche = multiplication();
    while (estOperateur("+", "-")) {
      gauche = binaire(prendreOperateur(), gauche, multiplication(), gauche.position);
    }
    return gauche;
  }

  function multiplication(): Noeud {
    let gauche = unaire();
    while (estOperateur("*", "/")) {
      gauche = binaire(prendreOperateur(), gauche, unaire(), gauche.position);
    }
    return gauche;
  }

  function unaire(): Noeud {
    if (!estOperateur("-")) return primaire();
    const { position } = avancer();
    return imbrique(position, () => creer({ type: "unaire", operateur: "-", operande: unaire(), position }));
  }

  function argumentsFonction(): Noeud[] {
    attendre("parenthese_ouvrante", "(");
    const liste: Noeud[] = [];
    if (courant().type !== "parenthese_fermante") {
      liste.push(expression());
      while (courant().type === "virgule") {
        avancer();
        liste.push(expression());
      }
    }
    attendre("parenthese_fermante", ")");
    return liste;
  }

  function primaire(): Noeud {
    const jeton = courant();
    if (jeton.type === "nombre") {
      avancer();
      return creer({ type: "nombre", valeur: jeton.valeur, position: jeton.position });
    }
    if (jeton.type === "parenthese_ouvrante") {
      avancer();
      const interieur = expression();
      attendre("parenthese_fermante", ")");
      return interieur;
    }
    if (jeton.type !== "nom") return echec("SYNTAXE", jeton.position, jeton.type === "fin" ? "fin" : "valeur");
    avancer();
    if (jeton.valeur === "TRUE" || jeton.valeur === "FALSE") return creer({ type: "booleen", valeur: jeton.valeur === "TRUE", position: jeton.position });
    if (MOTS_RESERVES.has(jeton.valeur)) return echec("SYNTAXE", jeton.position, "valeur");
    if (courant().type === "parenthese_ouvrante") {
      return imbrique(jeton.position, () => creer({ type: "fonction", nom: jeton.valeur, arguments: argumentsFonction(), position: jeton.position }));
    }
    return creer({ type: "variable", nom: jeton.valeur, position: jeton.position });
  }

  const arbre = expression();
  if (courant().type !== "fin") echec("SYNTAXE", courant().position, "fin_attendue");
  return arbre;
}
