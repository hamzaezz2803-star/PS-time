/**
 * Règles du module Programme (calendriers, rotations, affectations).
 * Fonctions pures, testées dans programme.test.ts.
 */

export const MINUTES_PAR_JOUR = 1440;
const MILLISECONDES_PAR_JOUR = 86_400_000;
const JOURS_PAR_SEMAINE = 7;

/** « 09:05 » donne 545 ; une saisie invalide donne null. */
export function heureVersMinutes(saisie: string): number | null {
  const correspondance = /^(\d{1,2}):(\d{2})$/.exec(saisie.trim());
  if (!correspondance) return null;
  const heures = Number(correspondance[1]);
  const minutes = Number(correspondance[2]);
  if (heures > 23 || minutes > 59) return null;
  return heures * 60 + minutes;
}

/** 545 donne « 09:05 » (format 24 h). */
export function minutesVersHeure(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  return `${String(heures).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Vrai pour un service de nuit : la fin tombe le lendemain (ex. 22:00 à 06:00). */
export function finLeLendemain(debut: number, fin: number): boolean {
  return fin < debut;
}

/** Durée du service, de l'heure de début à l'heure de fin (nuit comprise). */
export function dureeServiceMinutes(debut: number, fin: number): number {
  return (fin - debut + MINUTES_PAR_JOUR) % MINUTES_PAR_JOUR;
}

/** Temps de travail compté : durée du service moins la pause (jamais négatif). */
export function dureeTravailMinutes(debut: number, fin: number, pause: number): number {
  return Math.max(0, dureeServiceMinutes(debut, fin) - pause);
}

/** Durée d'une pause de … à … ; 0 sans pause (heures vides). */
export function dureePauseMinutes(debutPause: number | null, finPause: number | null): number {
  if (debutPause === null || finPause === null) return 0;
  return dureeServiceMinutes(debutPause, finPause);
}

/**
 * Vrai si la pause tient entièrement dans le service (nuit comprise) et laisse du temps
 * de travail : 12:00 à 13:00 dans 08:00 à 17:00, ou 02:00 à 02:30 dans 22:00 à 06:00.
 */
export function pauseDansService(debut: number, fin: number, debutPause: number, finPause: number): boolean {
  const decalage = (debutPause - debut + MINUTES_PAR_JOUR) % MINUTES_PAR_JOUR;
  const duree = dureeServiceMinutes(debutPause, finPause);
  const service = dureeServiceMinutes(debut, fin);
  return duree > 0 && duree < service && decalage + duree <= service;
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
