/**
 * État d'une badgeuse tel que lu sur le réseau (jamais stocké) et petites règles d'affichage.
 * Fonctions pures, testées dans etat.test.ts.
 */
import type { HeureLocale } from "./protocole-zk.ts";
import { comparerAdresses } from "./reseau.ts";

/**
 * en_ligne : la badgeuse répond ; protegee : elle exige un mot de passe de communication ;
 * injoignable : aucune réponse ; non_reconnue : un appareil répond, mais pas comme une badgeuse.
 */
export type StatutBadgeuse = "en_ligne" | "protegee" | "injoignable" | "non_reconnue";

export type EtatBadgeuse = {
  adresse: string;
  statut: StatutBadgeuse;
  nom: string | null;
  numeroSerie: string | null;
  version: string | null;
  /** Heure affichée par la badgeuse (AAAA-MM-JJ HH:MM:SS), null si elle n'a pas été lue. */
  heureAppareil: string | null;
  /** Écart avec l'heure du serveur en secondes (positif : la badgeuse avance). */
  ecartSecondes: number | null;
  utilisateurs: number | null;
  pointages: number | null;
  /** Instant de la lecture (ISO). */
  verifieLe: string;
};

export type EtatHeure = "a_l_heure" | "a_regler" | "inconnue";

export function etatHeure(ecartSecondes: number | null, tolereSecondes: number): EtatHeure {
  if (ecartSecondes === null) return "inconnue";
  return Math.abs(ecartSecondes) <= tolereSecondes ? "a_l_heure" : "a_regler";
}

/** Heure murale d'un instant dans un fuseau (celle que la badgeuse doit afficher). */
export function heureLocale(date: Date, fuseau: string): HeureLocale {
  const parties = new Intl.DateTimeFormat("en-GB", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const valeur = (type: Intl.DateTimeFormatPartTypes) => Number(parties.find((partie) => partie.type === type)?.value ?? 0);
  return { annee: valeur("year"), mois: valeur("month"), jour: valeur("day"), heures: valeur("hour"), minutes: valeur("minute"), secondes: valeur("second") };
}

const deuxChiffres = (nombre: number) => String(nombre).padStart(2, "0");

/** « 2026-11-27 08:05:42 » : forme lisible et triable, sans fuseau. */
export function texteHeureLocale(h: HeureLocale): string {
  return `${h.annee}-${deuxChiffres(h.mois)}-${deuxChiffres(h.jour)} ${deuxChiffres(h.heures)}:${deuxChiffres(h.minutes)}:${deuxChiffres(h.secondes)}`;
}

/** Une heure lue est vraisemblable (une badgeuse sans pile peut renvoyer n'importe quoi). */
export const heureVraisemblable = (h: HeureLocale): boolean =>
  h.annee >= 2000 && h.annee <= 2099 && h.mois >= 1 && h.mois <= 12 && h.jour >= 1 && h.jour <= 31 && h.heures < 24 && h.minutes < 60 && h.secondes < 60;

/** Badgeuses en ligne d'abord, puis par adresse. */
const RANG_STATUT: Record<StatutBadgeuse, number> = { en_ligne: 0, protegee: 1, non_reconnue: 2, injoignable: 3 };

export function trierBadgeuses(badgeuses: readonly EtatBadgeuse[]): EtatBadgeuse[] {
  return [...badgeuses].sort((a, b) => RANG_STATUT[a.statut] - RANG_STATUT[b.statut] || comparerAdresses(a.adresse, b.adresse));
}

/** Remplace la badgeuse de même adresse, ou l'ajoute. */
export function fusionnerBadgeuse(badgeuses: readonly EtatBadgeuse[], nouvelle: EtatBadgeuse): EtatBadgeuse[] {
  const autres = badgeuses.filter((badgeuse) => badgeuse.adresse !== nouvelle.adresse);
  return [...autres, nouvelle];
}
