/**
 * Événements : règles des périodes de prise. Fonctions pures, testées dans evenements.test.ts.
 */
import { PERIODES_PRISE_MAX } from "../constantes.ts";
import { joursEntre, periodesSeChevauchent } from "./programme.ts";

/** Période de prise : jours AAAA-MM-JJ, bornes comprises. */
export type PeriodePrise = { debut: string; fin: string };

export type ProblemePeriodes = "trop" | "ordre" | "chevauchement";

/** Problème des périodes saisies, ou null si elles sont valables (aucune période = toute l'année). */
export function verifierPeriodesPrise(periodes: readonly PeriodePrise[]): ProblemePeriodes | null {
  if (periodes.length > PERIODES_PRISE_MAX) return "trop";
  if (periodes.some((periode) => periode.fin < periode.debut)) return "ordre";
  const seChevauchent = periodes.some((periode, rang) => periodes.slice(rang + 1).some((autre) => periodesSeChevauchent(periode, autre)));
  return seChevauchent ? "chevauchement" : null;
}

/** Vrai si l'événement peut être pris ce jour-là : aucune période, ou le jour est dans l'une d'elles. */
export function estPrisAutoriseLe(periodes: readonly PeriodePrise[], jour: string): boolean {
  return periodes.length === 0 || periodes.some((periode) => periode.debut <= jour && jour <= periode.fin);
}

/** Périodes dans l'ordre du calendrier. */
export function trierPeriodes<T extends PeriodePrise>(periodes: readonly T[]): T[] {
  return [...periodes].sort((a, b) => a.debut.localeCompare(b.debut));
}

/**
 * Événement saisi pour un employé : journées entières du `debut` au `fin` (minutes vides), ou
 * heures de `debutMinutes` à `finMinutes` (fin exclue) sur un seul jour.
 */
export type SaisieEvenement = { debut: string; fin: string; debutMinutes: number | null; finMinutes: number | null };

/** Deux saisies d'un même employé se chevauchent-elles (un jour en commun, et des heures en commun si les deux sont en heures) ? */
export function saisiesSeChevauchent(a: SaisieEvenement, b: SaisieEvenement): boolean {
  if (a.fin < b.debut || b.fin < a.debut) return false;
  if (a.debutMinutes === null || a.finMinutes === null || b.debutMinutes === null || b.finMinutes === null) return true;
  return a.debutMinutes < b.finMinutes && b.debutMinutes < a.finMinutes;
}

/** Vrai si toute la saisie tient dans une période de prise (aucune période : toute l'année). */
export function estDansUnePeriodePrise(periodes: readonly PeriodePrise[], debut: string, fin: string): boolean {
  return periodes.length === 0 || periodes.some((periode) => periode.debut <= debut && fin <= periode.fin);
}

/** Vrai si la saisie couvre ce jour en entier (une saisie en heures ne couvre jamais la journée). */
export const couvreLaJournee = (saisie: SaisieEvenement, jour: string) => saisie.debutMinutes === null && saisie.debut <= jour && jour <= saisie.fin;

/** Nombre de jours d'une saisie, bornes comprises (1 pour une saisie en heures). */
export const nombreDeJours = (saisie: Pick<SaisieEvenement, "debut" | "fin">) => joursEntre(saisie.debut, saisie.fin) + 1;
