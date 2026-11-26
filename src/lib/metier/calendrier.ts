/**
 * Calendrier de choix d'une date (jours « AAAA-MM-JJ ») : grille du mois, bornes, déplacement au
 * clavier. Fonctions pures, testées dans calendrier.test.ts.
 */
import { ajouterJours } from "./compteurs/periodes.ts";

export type CaseCalendrier = { jour: string; estDuMois: boolean };

const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Jour bien formé et réel (« 2026-02-30 » est refusé). */
export function estJourValide(valeur: string): boolean {
  if (!FORMAT_JOUR.test(valeur)) return false;
  const date = new Date(`${valeur}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === valeur;
}

/** Mois « AAAA-MM » d'un jour. */
export const moisDuJour = (jour: string) => jour.slice(0, 7);

/** Premier et dernier jour d'un mois « AAAA-MM ». */
export function bornesDuMois(mois: string): { debut: string; fin: string } {
  const [annee, rang] = mois.split("-").map(Number);
  const nombreJours = new Date(Date.UTC(annee, rang, 0)).getUTCDate();
  return { debut: `${mois}-01`, fin: `${mois}-${String(nombreJours).padStart(2, "0")}` };
}

/** Mois voisin d'un mois « AAAA-MM » (-1 : précédent, +1 : suivant). */
export function moisVoisin(mois: string, decalage: number): string {
  const [annee, rang] = mois.split("-").map(Number);
  const date = new Date(Date.UTC(annee, rang - 1 + decalage, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Rang du jour dans la semaine : 0 = lundi ... 6 = dimanche. */
const rangDansSemaine = (jour: string) => (new Date(`${jour}T12:00:00Z`).getUTCDay() + 6) % 7;

/**
 * Semaines du lundi au dimanche qui couvrent le mois, avec les jours des mois voisins (grisés à
 * l'affichage, mais cliquables) pour garder une grille pleine.
 */
export function grilleCalendrier(mois: string): CaseCalendrier[][] {
  const { debut, fin } = bornesDuMois(mois);
  const semaines: CaseCalendrier[][] = [];
  for (let lundi = ajouterJours(debut, -rangDansSemaine(debut)); lundi <= fin; lundi = ajouterJours(lundi, 7)) {
    semaines.push(Array.from({ length: 7 }, (_, rang) => {
      const jour = ajouterJours(lundi, rang);
      return { jour, estDuMois: jour >= debut && jour <= fin };
    }));
  }
  return semaines;
}

/** Jour permis par les bornes facultatives (incluses). */
export function estDansBornes(jour: string, min?: string, max?: string): boolean {
  return (!min || jour >= min) && (!max || jour <= max);
}

/** Jour ramené dans les bornes. */
export function bornerJour(jour: string, min?: string, max?: string): string {
  if (min && jour < min) return min;
  if (max && jour > max) return max;
  return jour;
}

const DECALAGES_TOUCHES: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/**
 * Jour atteint par une touche depuis le jour actif : flèches (jour, semaine), Début et Fin (lundi,
 * dimanche de la semaine), Page précédente et suivante (mois). null pour une autre touche.
 */
export function jourApresTouche(jour: string, touche: string): string | null {
  if (touche in DECALAGES_TOUCHES) return ajouterJours(jour, DECALAGES_TOUCHES[touche]);
  const rangSemaine = rangDansSemaine(jour);
  if (touche === "Home") return ajouterJours(jour, -rangSemaine);
  if (touche === "End") return ajouterJours(jour, 6 - rangSemaine);
  if (touche === "PageUp" || touche === "PageDown") return memeJourAutreMois(jour, touche === "PageUp" ? -1 : 1);
  return null;
}

/** Même jour dans le mois voisin, ramené au dernier jour du mois s'il n'existe pas (31 → 30). */
export function memeJourAutreMois(jour: string, decalage: number): string {
  const mois = moisVoisin(moisDuJour(jour), decalage);
  let numero = Number(jour.slice(8, 10));
  while (numero > 28 && !estJourValide(`${mois}-${String(numero).padStart(2, "0")}`)) numero -= 1;
  return `${mois}-${String(numero).padStart(2, "0")}`;
}
