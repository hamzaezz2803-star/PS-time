/**
 * Rapport des présences de l'horaire dynamique : pour chaque employé concerné et chaque jour
 * pointé, son premier pointage et l'horaire que la règle a reconnu (ou aucun).
 * Fonctions pures, testées dans rapport-presences.test.ts.
 */
import { ajouterJours } from "./compteurs/periodes.ts";
import { premiersPointages, regleReconnue, type RegleHoraire } from "./horaire-dynamique.ts";

export type LigneRapport = {
  employeId: string;
  jour: string;
  /** Premier pointage du jour, en minutes depuis minuit (heure locale). */
  minutes: number;
  /** Profil reconnu, ou null si aucune règle (ou plusieurs) ne correspond. */
  profilId: string | null;
};

/** Une ligne par employé et par jour : le premier pointage et le profil reconnu. Plus récent d'abord. */
export function lignesRapport(pointages: readonly { employeId: string; jour: string; minutes: number }[], regles: readonly RegleHoraire[]): LigneRapport[] {
  const lignes = [...premiersPointages(pointages)].map(([cle, minutes]) => {
    const [employeId, jour] = cle.split("|");
    return { employeId, jour, minutes, profilId: regleReconnue(regles, jour, minutes)?.profilId ?? null };
  });
  return lignes.sort((a, b) => b.jour.localeCompare(a.jour) || b.minutes - a.minutes);
}

export type PeriodeRapport = { du: string; au: string };

/** Périodes rapides : le mois en cours, ou les 7 derniers jours (aujourd'hui compris). */
export function periodeRapide(choix: "mois" | "semaine", aujourdhui: string): PeriodeRapport {
  return choix === "mois" ? { du: `${aujourdhui.slice(0, 7)}-01`, au: aujourdhui } : { du: ajouterJours(aujourdhui, -6), au: aujourdhui };
}

/**
 * Période demandée rendue sûre : jamais après aujourd'hui, début avant fin, et pas plus de
 * `joursMax` jours (le début est alors rapproché de la fin).
 */
export function bornerPeriode(periode: PeriodeRapport, aujourdhui: string, joursMax: number): PeriodeRapport {
  const au = periode.au > aujourdhui ? aujourdhui : periode.au;
  const plusTot = ajouterJours(au, -(joursMax - 1));
  const du = periode.du > au ? au : periode.du < plusTot ? plusTot : periode.du;
  return { du, au };
}
