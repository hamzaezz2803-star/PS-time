/**
 * Mot de passe du jour du compte d'installation « pstime » (connu de l'installateur).
 *
 * Règle : JJMM + quatre chiffres qui partent du numéro du jour de la semaine (lundi = 1 ...
 * dimanche = 7) et augmentent de 1, additionnés chiffre par chiffre SANS retenue
 * (seules les unités comptent : 9 + 4 = 3).
 *
 *   Lundi 16/11/2026    : 1611 + 1234 = 2845
 *   Dimanche 15/11/2026 : 1511 + 7890 = 8301
 */

const NOMBRE_CHIFFRES = 4;
const BASE_DECIMALE = 10;
const JOURS_PAR_SEMAINE = 7;

/** Calcule le mot de passe à partir du jour, du mois et du numéro du jour de la semaine (1 à 7). */
export function calculerMotDePasseDuJour(jour: number, mois: number, numeroJourSemaine: number): string {
  const date = `${String(jour).padStart(2, "0")}${String(mois).padStart(2, "0")}`;
  return Array.from({ length: NOMBRE_CHIFFRES }, (_, rang) => {
    const chiffreDate = Number(date[rang]);
    const chiffreSemaine = (numeroJourSemaine + rang) % BASE_DECIMALE;
    return String((chiffreDate + chiffreSemaine) % BASE_DECIMALE);
  }).join("");
}

const NUMERO_JOUR: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: JOURS_PAR_SEMAINE };

/** Mot de passe du jour à l'instant donné, d'après la date dans le fuseau indiqué. */
export function motDePasseDuJour(instant: Date, fuseau: string): string {
  const parties = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: fuseau, day: "numeric", month: "numeric", weekday: "short" })
      .formatToParts(instant)
      .map((partie) => [partie.type, partie.value]),
  );
  return calculerMotDePasseDuJour(Number(parties.day), Number(parties.month), NUMERO_JOUR[parties.weekday]);
}
