/**
 * Règles du module Programme (heures, rotations, affectations).
 * Fonctions pures, testées dans programme.test.ts.
 */

export const MINUTES_PAR_JOUR = 1440;
const MILLISECONDES_PAR_JOUR = 86_400_000;
const JOURS_PAR_SEMAINE = 7;

/** 545 donne « 09:05 » (format 24 h). */
export function minutesVersHeure(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  return `${String(heures).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** 480 donne « 8 h 00 », 45 donne « 0 h 45 ». */
export function formaterDuree(minutes: number): string {
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** Nombre de jours entre deux jours du calendrier (AAAA-MM-JJ), sans effet de fuseau. */
export function joursEntre(debut: string, fin: string): number {
  const enJours = (jour: string) => Date.parse(`${jour}T00:00:00Z`) / MILLISECONDES_PAR_JOUR;
  return Math.round(enJours(fin) - enJours(debut));
}

/** Jour de la semaine, lundi = 0 … dimanche = 6. */
export function jourDeSemaine(jour: string): number {
  const dimancheZero = new Date(`${jour}T00:00:00Z`).getUTCDay();
  return (dimancheZero + JOURS_PAR_SEMAINE - 1) % JOURS_PAR_SEMAINE;
}

export type TypeRotation = "hebdomadaire" | "cycle";

/**
 * Numéro du jour de la rotation qui s'applique à une date : le jour de la semaine pour une
 * rotation hebdomadaire, sinon la position dans le cycle depuis le début de l'affectation.
 * Renvoie null avant le début de l'affectation.
 */
export function numeroJourRotation(
  rotation: { type: TypeRotation; nombreJours: number },
  debutAffectation: string,
  jour: string,
): number | null {
  const ecart = joursEntre(debutAffectation, jour);
  if (ecart < 0) return null;
  if (rotation.type === "hebdomadaire") return jourDeSemaine(jour);
  return ecart % rotation.nombreJours;
}

export type Periode = { debut: string; fin: string | null };

/** Deux périodes (fin vide = sans fin) ont-elles au moins un jour en commun ? */
export function periodesSeChevauchent(a: Periode, b: Periode): boolean {
  const aAvantB = a.fin !== null && a.fin < b.debut;
  const bAvantA = b.fin !== null && b.fin < a.debut;
  return !aAvantB && !bAvantA;
}

/** Écart lisible : « 12 min » sous une heure, sinon « 1 h 05 ». */
export function formaterEcart(minutes: number): string {
  return minutes < 60 ? `${minutes} min` : formaterDuree(minutes);
}
