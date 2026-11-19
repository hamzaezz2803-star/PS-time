/**
 * Événements : règles des périodes de prise. Fonctions pures, testées dans evenements.test.ts.
 */
import { PERIODES_PRISE_MAX } from "../constantes.ts";
import { periodesSeChevauchent } from "./programme.ts";

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
