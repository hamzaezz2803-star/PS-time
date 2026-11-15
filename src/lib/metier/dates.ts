/** Dates dans le fuseau de l'entreprise. Fonctions pures, testées dans dates.test.ts. */

/** Jour (AAAA-MM-JJ) d'un instant dans un fuseau donné (nom de fichier, valeur d'un champ date). */
export function jourDansFuseau(date: Date, fuseau: string): string {
  // Le format suédois donne directement AAAA-MM-JJ.
  return new Intl.DateTimeFormat("sv-SE", { timeZone: fuseau, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

const MINUTES_PAR_HEURE = 60;

/** Jour local (AAAA-MM-JJ) et minute depuis minuit locale d'un instant (ex. 09:57 donne 597). */
export function jourEtMinuteLocaux(date: Date, fuseau: string): { jour: string; minutes: number } {
  const heure = new Intl.DateTimeFormat("en-GB", { timeZone: fuseau, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  const [heures, minutes] = heure.split(":").map(Number);
  return { jour: jourDansFuseau(date, fuseau), minutes: heures * MINUTES_PAR_HEURE + minutes };
}

/** Veille d'un jour du calendrier (AAAA-MM-JJ), sans effet de fuseau. */
export function jourPrecedent(jour: string): string {
  const date = new Date(`${jour}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
