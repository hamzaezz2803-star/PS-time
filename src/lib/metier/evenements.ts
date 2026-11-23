/**
 * Événements : durée d'un événement en heures et saisies des employés. Fonctions pures,
 * testées dans evenements.test.ts.
 */
import { DUREE_EVENEMENT_MAX_MINUTES, PAS_DUREE_EVENEMENT_MINUTES, PRIORITE_EVENEMENT_MAX } from "../constantes.ts";
import { joursEntre } from "./programme.ts";

/**
 * Nombre d'heures saisi (« 2 », « 1,5 » ou « 1.5 ») en minutes, par demi-heure, de 30 min à 24 h.
 * Null si la saisie n'est pas un tel nombre.
 */
export function heuresEnMinutes(saisie: string): number | null {
  const texte = saisie.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(texte)) return null;
  const minutes = Math.round(Number(texte) * 60);
  const estValable = minutes >= PAS_DUREE_EVENEMENT_MINUTES && minutes <= DUREE_EVENEMENT_MAX_MINUTES && minutes % PAS_DUREE_EVENEMENT_MINUTES === 0;
  return estValable ? minutes : null;
}

export type NiveauPriorite = "basse" | "moyenne" | "haute";

/** Niveau lisible d'une priorité de 0 à `maximum`, par tiers : 0 à 84 basse, 85 à 169 moyenne, 170 et plus haute. */
export function niveauPriorite(valeur: number, maximum = PRIORITE_EVENEMENT_MAX): NiveauPriorite {
  const tiers = (maximum + 1) / 3;
  if (valeur < tiers) return "basse";
  return valeur < 2 * tiers ? "moyenne" : "haute";
}

/** Minutes en nombre d'heures lisible : 90 → « 1,5 ». */
export const minutesEnHeures = (minutes: number) => String(minutes / 60).replace(".", ",");

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

/** Vrai si la saisie couvre ce jour en entier (une saisie en heures ne couvre jamais la journée). */
export const couvreLaJournee = (saisie: SaisieEvenement, jour: string) => saisie.debutMinutes === null && saisie.debut <= jour && jour <= saisie.fin;

/** Nombre de jours d'une saisie, bornes comprises (1 pour une saisie en heures). */
export const nombreDeJours = (saisie: Pick<SaisieEvenement, "debut" | "fin">) => joursEntre(saisie.debut, saisie.fin) + 1;
