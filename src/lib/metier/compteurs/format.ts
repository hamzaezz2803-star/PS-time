/**
 * Unités des compteurs et affichage de leurs valeurs (format français, heures en 24 h).
 * Fonctions pures, testées dans format.test.ts.
 */
import { LANGUE_FORMATS } from "../../constantes.ts";
import type { Periodicite } from "./periodes.ts";

export const UNITES_COMPTEUR = ["minutes", "heures", "jours", "nombre", "pourcentage"] as const;
export type UniteCompteur = (typeof UNITES_COMPTEUR)[number];

const nombre = new Intl.NumberFormat(LANGUE_FORMATS, { maximumFractionDigits: 2 });

/** 90 donne « 1h 30 », -45 donne « -0h 45 » ; la valeur est arrondie à la minute. */
export function formaterMinutes(minutes: number): string {
  const total = Math.round(Math.abs(minutes));
  const signe = minutes < 0 && total > 0 ? "-" : "";
  return `${signe}${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}`;
}

/** Valeur lisible selon l'unité du compteur. */
export function formaterValeur(valeur: number, unite: UniteCompteur): string {
  switch (unite) {
    case "minutes":
      return formaterMinutes(valeur);
    case "heures":
      return `${nombre.format(valeur)} h`;
    case "jours":
      return `${nombre.format(valeur)} j`;
    case "pourcentage":
      return `${nombre.format(valeur)} %`;
    default:
      return nombre.format(valeur);
  }
}

/** Colonnes booléennes de la base ↔ liste des périodicités, dans l'ordre jour, semaine, mois. */
export type ColonnesPeriodicites = { journalier: boolean; hebdomadaire: boolean; mensuel: boolean };

export function periodicitesDesColonnes(colonnes: ColonnesPeriodicites): Periodicite[] {
  const liste: Periodicite[] = [];
  if (colonnes.journalier) liste.push("JOUR");
  if (colonnes.hebdomadaire) liste.push("SEMAINE");
  if (colonnes.mensuel) liste.push("MOIS");
  return liste;
}

export function colonnesDesPeriodicites(periodicites: readonly Periodicite[]): ColonnesPeriodicites {
  return { journalier: periodicites.includes("JOUR"), hebdomadaire: periodicites.includes("SEMAINE"), mensuel: periodicites.includes("MOIS") };
}

/** Vrai si un changement oblige à créer une nouvelle version (formule, unité ou périodicités). */
export function changeLaVersion(
  avant: { formule: string; unite: string; periodicites: readonly Periodicite[] },
  apres: { formule: string; unite: string; periodicites: readonly Periodicite[] },
): boolean {
  return avant.formule !== apres.formule || avant.unite !== apres.unite || avant.periodicites.join() !== apres.periodicites.join();
}
