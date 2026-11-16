/**
 * Profils horaires (modèle Gestor Easy simplifié) : la journée de 00:00 à 24:00 découpée en
 * plages typées. Fonctions pures, testées dans profil-horaire.test.ts.
 *
 * Exemple « journée de 8 h » : 00-07 Interdite, 07-08 Variable, 08-12 Fixe, 12-14 Repas,
 * 14-18 Fixe, 18-19 Variable, 19-24 Interdite. Théorique = somme des plages fixes = 8 h.
 */
import { MINUTES_PAR_JOUR } from "./programme.ts";

export const TYPES_PLAGE = ["interdite", "neutralisee", "variable", "fixe", "repas", "retard_tolere"] as const;
export type TypePlage = (typeof TYPES_PLAGE)[number];

/** Une plage : de `debut` à `fin` (minutes depuis minuit, fin exclue, 1440 = 24:00). */
export type Plage = { debut: number; fin: number; type: TypePlage };

/** Modèle prêt à l'emploi proposé dans le formulaire (le schéma du responsable). */
export const PLAGES_JOURNEE_TYPE: Plage[] = [
  { debut: 0, fin: 420, type: "interdite" },
  { debut: 420, fin: 480, type: "variable" },
  { debut: 480, fin: 720, type: "fixe" },
  { debut: 720, fin: 840, type: "repas" },
  { debut: 840, fin: 1080, type: "fixe" },
  { debut: 1080, fin: 1140, type: "variable" },
  { debut: 1140, fin: MINUTES_PAR_JOUR, type: "interdite" },
];

export type ErreurPlages = "vide" | "trou" | "duree_nulle" | "pas_de_fixe";

/**
 * Vérifie le découpage : plages bout à bout de 00:00 à 24:00, chacune de durée positive,
 * et au moins une plage fixe (sinon le théorique serait nul). Renvoie l'erreur, ou null.
 */
export function verifierPlages(plages: Plage[]): ErreurPlages | null {
  if (plages.length === 0) return "vide";
  let attendu = 0;
  for (const plage of plages) {
    if (plage.debut !== attendu) return "trou";
    if (plage.fin <= plage.debut) return "duree_nulle";
    attendu = plage.fin;
  }
  if (attendu !== MINUTES_PAR_JOUR) return "trou";
  return plages.some((plage) => plage.type === "fixe") ? null : "pas_de_fixe";
}

/** Temps que l'employé doit faire dans la journée : la somme des plages fixes. */
export function theoriqueMinutes(plages: Plage[]): number {
  return plages.filter((plage) => plage.type === "fixe").reduce((total, plage) => total + plage.fin - plage.debut, 0);
}

/** Durée de la plage repas (la plus longue s'il y en a plusieurs), 0 sans repas. */
export function dureeRepasMinutes(plages: Plage[]): number {
  return Math.max(0, ...plages.filter((plage) => plage.type === "repas").map((plage) => plage.fin - plage.debut));
}

/** Plage qui contient la minute donnée (0 à 1439). */
export function plageA(plages: Plage[], minute: number): Plage | null {
  return plages.find((plage) => minute >= plage.debut && minute < plage.fin) ?? null;
}

/** Arrivée (entrée, retour de pause) ou départ (sortie, départ en pause). */
export type Sens = "arrivee" | "depart";

/** Début de la prochaine plage fixe après `minute`, ou null. */
function prochainDebutFixe(plages: Plage[], minute: number): number | null {
  return plages.find((plage) => plage.type === "fixe" && plage.debut >= minute)?.debut ?? null;
}

/** Fin de la dernière plage fixe avant `minute`, ou null. */
function derniereFinFixe(plages: Plage[], minute: number): number | null {
  const avant = plages.filter((plage) => plage.type === "fixe" && plage.fin <= minute);
  return avant.length > 0 ? avant[avant.length - 1].fin : null;
}

/**
 * Point validé (heure retenue pour le calcul) : dans une plage fixe, l'heure réelle ; ailleurs,
 * la borne de la plage fixe voisine. Arrivée à 07:30 (variable) → 08:00 ; retour de repas à
 * 13:30 → 14:00 ; départ à 19:00 → 18:00. Null dans une plage interdite ou sans plage fixe voisine.
 */
export function pointValide(plages: Plage[], minute: number, sens: Sens): number | null {
  const plage = plageDuPointage(plages, minute, sens);
  if (!plage || plage.type === "interdite") return null;
  if (plage.type === "fixe") return minute;
  const proche = sens === "arrivee" ? prochainDebutFixe(plages, minute) : derniereFinFixe(plages, minute);
  return proche ?? (sens === "arrivee" ? derniereFinFixe(plages, minute) : prochainDebutFixe(plages, minute));
}

/**
 * Plage d'un pointage. Un départ ferme la plage qu'il termine : partir à 19:00 pile, c'est
 * quitter la plage 18:00-19:00, pas entrer dans la plage interdite qui commence à 19:00.
 */
export function plageDuPointage(plages: Plage[], minute: number, sens: Sens): Plage | null {
  return plageA(plages, sens === "depart" ? minute - 1 : minute);
}
