/**
 * Historique des actions (traçabilité) : types, module de chaque objet et regroupement par jour.
 * Fonctions pures, testées dans historique.test.ts.
 */
import { ACTIONS_HISTORIQUE, MODULES_HISTORIQUE } from "../constantes.ts";
import { MODULE_DE_L_OBJET } from "./notifications.ts";

export type ActionHistorique = (typeof ACTIONS_HISTORIQUE)[number];
export type ModuleHistorique = (typeof MODULES_HISTORIQUE)[number];

/** Objets notifiés, plus ceux qui ne vont que dans l'historique (exports, sessions). */
export const MODULE_DE_L_OBJET_HISTORIQUE = {
  ...MODULE_DE_L_OBJET,
  rapport_presences: "planning",
  session: "administration",
} as const satisfies Record<string, ModuleHistorique>;

export type ObjetHistorique = keyof typeof MODULE_DE_L_OBJET_HISTORIQUE;

const dansListe = <T extends string>(liste: readonly T[]) => (valeur: string): valeur is T => (liste as readonly string[]).includes(valeur);
export const estActionHistorique = dansListe(ACTIONS_HISTORIQUE);
export const estModuleHistorique = dansListe(MODULES_HISTORIQUE);
export const estObjetHistorique = (valeur: string): valeur is ObjetHistorique => valeur in MODULE_DE_L_OBJET_HISTORIQUE;

/** Entrées regroupées par jour local, dans l'ordre reçu (le plus récent d'abord). */
export function grouperParJour<T extends { creeLe: Date }>(entrees: readonly T[], jourDe: (date: Date) => string): { jour: string; entrees: T[] }[] {
  const groupes: { jour: string; entrees: T[] }[] = [];
  for (const entree of entrees) {
    const jour = jourDe(entree.creeLe);
    const dernier = groupes.at(-1);
    if (dernier?.jour === jour) dernier.entrees.push(entree);
    else groupes.push({ jour, entrees: [entree] });
  }
  return groupes;
}

/** Nombre d'actions par type, chaque type présent même à zéro (cartes de résumé). */
export function compterParAction(lignes: readonly { action: string; total: number }[]): Record<ActionHistorique, number> {
  const comptes = Object.fromEntries(ACTIONS_HISTORIQUE.map((action) => [action, 0])) as Record<ActionHistorique, number>;
  for (const ligne of lignes) if (estActionHistorique(ligne.action)) comptes[ligne.action] += ligne.total;
  return comptes;
}

/** Pages de la liste : numéro ramené entre 1 et la dernière page (au moins une). */
export function paginer(total: number, parPage: number, demandee: number): { page: number; pages: number; decalage: number } {
  const pages = Math.max(1, Math.ceil(total / parPage));
  const page = Math.min(Math.max(1, Math.trunc(demandee) || 1), pages);
  return { page, pages, decalage: (page - 1) * parPage };
}
