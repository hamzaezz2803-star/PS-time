import { FUSEAU_HORAIRE, LANGUE_FORMATS } from "@/lib/constantes";

// Formats imposés par les règles : « ven. 14 nov. 2026 » et « 14:30 » (24 h).
const formatDate = new Intl.DateTimeFormat(LANGUE_FORMATS, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: FUSEAU_HORAIRE,
});

const formatHeure = new Intl.DateTimeFormat(LANGUE_FORMATS, {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: FUSEAU_HORAIRE,
});

const formatHeureSecondes = new Intl.DateTimeFormat(LANGUE_FORMATS, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: FUSEAU_HORAIRE,
});

/** Heures, minutes et secondes (deux chiffres chacune) à Casablanca, pour l'horloge à palettes. */
export function heureEnChiffres(date: Date): { heures: string; minutes: string; secondes: string } {
  const parties = Object.fromEntries(formatHeureSecondes.formatToParts(date).map((partie) => [partie.type, partie.value]));
  return { heures: parties.hour ?? "00", minutes: parties.minute ?? "00", secondes: parties.second ?? "00" };
}

export function formaterDate(date: Date): string {
  return formatDate.format(date);
}

export function formaterHeure(date: Date): string {
  return formatHeure.format(date);
}

/** Initiales pour un avatar : « Admin Fictif » donne « AF », « admin » donne « A ». */
export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  return mots
    .slice(0, 2)
    .map((mot) => mot[0]?.toLocaleUpperCase(LANGUE_FORMATS) ?? "")
    .join("");
}

/** Jour du calendrier (AAAA-MM-JJ) : midi UTC évite tout décalage de jour avec le fuseau. */
export function formaterJour(jour: string): string {
  return formatDate.format(new Date(`${jour}T12:00:00Z`));
}
