/** Règles des pointages. Fonctions pures, testées dans pointages.test.ts. */
import { TOLERANCE_POINTAGE_FUTUR_MINUTES } from "../constantes.ts";

const MILLISECONDES_PAR_MINUTE = 60_000;

/** Décalage (en minutes) d'un fuseau par rapport à UTC à un instant donné (ex. +60 à Casablanca). */
function decalageMinutes(instant: number, fuseau: string): number {
  const parties = new Intl.DateTimeFormat("en-US", {
    timeZone: fuseau,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const valeur = (type: string) => Number(parties.find((partie) => partie.type === type)?.value);
  const commeUtc = Date.UTC(valeur("year"), valeur("month") - 1, valeur("day"), valeur("hour"), valeur("minute"), valeur("second"));
  return Math.round((commeUtc - Math.floor(instant / 1000) * 1000) / MILLISECONDES_PAR_MINUTE);
}

/**
 * Instant UTC d'une date et d'une heure saisies dans le fuseau de l'entreprise
 * (« 2026-11-15 » et « 09:57 » à Casablanca). Gère les changements d'heure. null si invalide.
 */
export function heureLocaleVersUtc(jour: string, heure: string, fuseau: string): Date | null {
  const dateOk = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour);
  const heureOk = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(heure);
  if (!dateOk || !heureOk) return null;
  const [annee, mois, journee] = [Number(dateOk[1]), Number(dateOk[2]), Number(dateOk[3])];
  const commeUtc = Date.UTC(annee, mois - 1, journee, Number(heureOk[1]), Number(heureOk[2]));
  const verification = new Date(commeUtc);
  if (verification.getUTCMonth() !== mois - 1 || verification.getUTCDate() !== journee) return null;

  // Premier essai avec le décalage à cet instant, puis correction si un changement d'heure tombe entre les deux.
  let instant = commeUtc - decalageMinutes(commeUtc, fuseau) * MILLISECONDES_PAR_MINUTE;
  instant = commeUtc - decalageMinutes(instant, fuseau) * MILLISECONDES_PAR_MINUTE;
  return new Date(instant);
}

/** Vrai si le pointage est dans le futur (au-delà de la petite marge tolérée). */
export function estDansLeFutur(horodatage: Date, maintenant: Date): boolean {
  return horodatage.getTime() > maintenant.getTime() + TOLERANCE_POINTAGE_FUTUR_MINUTES * MILLISECONDES_PAR_MINUTE;
}

/** Message de réussite : nombre enregistré et doublons ignorés. */
export function bilanPointages(demandes: number, enregistres: number): { enregistres: number; doublons: number } {
  return { enregistres, doublons: Math.max(demandes - enregistres, 0) };
}
