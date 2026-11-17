/**
 * Calcul d'un arbre déjà typé. Une donnée manquante (null) n'est jamais remplacée par 0 :
 * elle se propage jusqu'au résultat, sauf si COALESCE fournit une autre valeur ou si AND / OR
 * connaissent déjà la réponse (FALSE AND ?, TRUE OR ?). IF ne calcule que la branche retenue.
 */
import { FORMULE_DECIMALES_MAX } from "../../constantes.ts";
import { echec } from "./erreurs.ts";
import type { Noeud } from "./parser.ts";

export type Valeur = number | boolean | null;

type Contexte = {
  valeurs: ReadonlyMap<string, number | null>;
  /** Variables rencontrées sans valeur, pour expliquer une donnée manquante. */
  manquantes: Set<string>;
};

/** Résultat fini, sinon erreur (dépassement de capacité). */
function fini(valeur: number, position: number): number {
  if (!Number.isFinite(valeur)) echec("VALEUR_INVALIDE", position);
  return valeur;
}

/** Arrondi « au plus proche, 0,5 en s'éloignant de zéro », sans les erreurs d'écriture binaire (1.005). */
function arrondir(valeur: number, decimales: number, position: number): number {
  if (!Number.isInteger(decimales) || decimales < 0 || decimales > FORMULE_DECIMALES_MAX) echec("ARGUMENT_INVALIDE", position, "ROUND");
  const absolu = Math.abs(valeur);
  const arrondi = Number(`${Math.round(Number(`${absolu}e${decimales}`))}e-${decimales}`);
  return Math.sign(valeur) * arrondi;
}

function calculerFonction(noeud: Extract<Noeud, { type: "fonction" }>, contexte: Contexte): Valeur {
  const args = noeud.arguments;
  if (noeud.nom === "IF") {
    const condition = calculer(args[0], contexte);
    return condition === null ? null : calculer(condition ? args[1] : args[2], contexte);
  }
  if (noeud.nom === "COALESCE") {
    for (const argument of args) {
      const valeur = calculer(argument, contexte);
      if (valeur !== null) return valeur;
    }
    return null;
  }
  const nombres = args.map((argument) => calculer(argument, contexte) as number | null);
  if (nombres.some((nombre) => nombre === null)) return null;
  const [x, n] = nombres as number[];
  switch (noeud.nom) {
    case "MIN":
      return Math.min(...(nombres as number[]));
    case "MAX":
      return Math.max(...(nombres as number[]));
    case "ABS":
      return Math.abs(x);
    case "FLOOR":
      return Math.floor(x);
    case "CEIL":
      return Math.ceil(x);
    default:
      return arrondir(x, n ?? 0, noeud.position);
  }
}

/** AND / OR en logique à trois valeurs : la réponse est connue sans l'autre côté quand c'est possible. */
function calculerLogique(noeud: Extract<Noeud, { type: "binaire" }>, contexte: Contexte): Valeur {
  const decisif = noeud.operateur === "OR";
  const gauche = calculer(noeud.gauche, contexte);
  if (gauche === decisif) return decisif;
  const droite = calculer(noeud.droite, contexte);
  if (droite === decisif) return decisif;
  return gauche === null || droite === null ? null : !decisif;
}

function calculerBinaire(noeud: Extract<Noeud, { type: "binaire" }>, contexte: Contexte): Valeur {
  if (noeud.operateur === "AND" || noeud.operateur === "OR") return calculerLogique(noeud, contexte);
  const gauche = calculer(noeud.gauche, contexte);
  const droite = calculer(noeud.droite, contexte);
  if (gauche === null || droite === null) return null;
  switch (noeud.operateur) {
    case "+":
      return fini((gauche as number) + (droite as number), noeud.position);
    case "-":
      return fini((gauche as number) - (droite as number), noeud.position);
    case "*":
      return fini((gauche as number) * (droite as number), noeud.position);
    case "/":
      if (droite === 0) echec("DIVISION_PAR_ZERO", noeud.droite.position);
      return fini((gauche as number) / (droite as number), noeud.position);
    case "=":
      return gauche === droite;
    case "!=":
      return gauche !== droite;
    case ">":
      return gauche > droite;
    case "<":
      return gauche < droite;
    case ">=":
      return gauche >= droite;
    default:
      return gauche <= droite;
  }
}

export function calculer(noeud: Noeud, contexte: Contexte): Valeur {
  switch (noeud.type) {
    case "nombre":
    case "booleen":
      return noeud.valeur;
    case "variable": {
      const valeur = contexte.valeurs.get(noeud.nom) ?? null;
      if (valeur === null) contexte.manquantes.add(noeud.nom);
      return valeur;
    }
    case "unaire": {
      const valeur = calculer(noeud.operande, contexte);
      if (valeur === null) return null;
      return noeud.operateur === "NOT" ? !valeur : -(valeur as number);
    }
    case "fonction":
      return calculerFonction(noeud, contexte);
    case "binaire":
      return calculerBinaire(noeud, contexte);
  }
}
