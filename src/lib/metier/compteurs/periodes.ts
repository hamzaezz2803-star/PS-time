/**
 * Périodes des compteurs : le jour, la semaine (lundi → dimanche) et le mois qui contiennent une
 * date, limités aux jours écoulés (jamais au-delà d'aujourd'hui). Jours du calendrier AAAA-MM-JJ,
 * sans effet de fuseau. Fonctions pures, testées dans periodes.test.ts.
 */
import { jourDeSemaine } from "../programme.ts";

export const PERIODICITES = ["JOUR", "SEMAINE", "MOIS"] as const;
export type Periodicite = (typeof PERIODICITES)[number];

/** Période complète (`debut`, `fin`) et partie déjà écoulée (`debut` → `finCalcul`). */
export type Periode = { periodicite: Periodicite; debut: string; fin: string; finCalcul: string };

const versDate = (jour: string) => new Date(`${jour}T12:00:00Z`);
const versJour = (date: Date) => date.toISOString().slice(0, 10);

/** Jour décalé de `nombre` jours (négatif pour reculer). */
export function ajouterJours(jour: string, nombre: number): string {
  const date = versDate(jour);
  date.setUTCDate(date.getUTCDate() + nombre);
  return versJour(date);
}

/** Tous les jours de `debut` à `fin` inclus (vide si fin < debut). */
export function joursEntre(debut: string, fin: string): string[] {
  const jours: string[] = [];
  for (let jour = debut; jour <= fin; jour = ajouterJours(jour, 1)) jours.push(jour);
  return jours;
}

/** Lundi et dimanche de la semaine du jour. */
export function semaineDe(jour: string): { debut: string; fin: string } {
  const lundi = ajouterJours(jour, -jourDeSemaine(jour));
  return { debut: lundi, fin: ajouterJours(lundi, 6) };
}

/** Premier et dernier jour du mois du jour. */
export function moisDe(jour: string): { debut: string; fin: string } {
  const date = versDate(jour);
  const dernier = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12));
  return { debut: `${jour.slice(0, 7)}-01`, fin: versJour(dernier) };
}

/**
 * Jour, semaine et mois contenant `date`, chacun calculé jusqu'à `aujourdhui` au plus.
 * Une date future ne donne aucune période (rien n'est calculé à l'avance).
 */
export function periodesDeLaDate(date: string, aujourdhui: string): Periode[] {
  if (date > aujourdhui) return [];
  const borne = (fin: string) => (fin < aujourdhui ? fin : aujourdhui);
  const semaine = semaineDe(date);
  const mois = moisDe(date);
  return [
    { periodicite: "JOUR", debut: date, fin: date, finCalcul: date },
    { periodicite: "SEMAINE", ...semaine, finCalcul: borne(semaine.fin) },
    { periodicite: "MOIS", ...mois, finCalcul: borne(mois.fin) },
  ];
}
