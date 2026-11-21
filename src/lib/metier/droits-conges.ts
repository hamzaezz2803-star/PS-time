/**
 * Droits aux congés : jours acquis, jours pris et soldes (d'après la « Gestion des droits » de
 * Gestor, simplifiée). Fonctions pures, testées dans droits-conges.test.ts.
 *
 * Règles :
 * - acquis = reliquat (reste de la période précédente) + jours acquis de la période ;
 * - seules les absences en journées entières du même événement consomment le droit, et seulement
 *   pour leurs jours compris dans la période ;
 * - un jour de repos d'après le planning de l'employé n'est pas décompté (week-end d'une semaine
 *   de congé) ; sans planning, chaque jour est décompté ;
 * - « pris » : jours passés, aujourd'hui compris ; « prévus » : jours à venir déjà saisis ;
 * - solde au jour = acquis - pris ; solde prévisionnel = acquis - pris - prévus.
 */
import type { SaisieEvenement } from "./evenements.ts";

export type PeriodeDroit = { debut: string; fin: string; joursAcquis: number; joursReliquat: number };

export type BilanDroit = {
  acquis: number;
  pris: number;
  prevus: number;
  soldeAujourdhui: number;
  soldePrevisionnel: number;
};

/** Absence décomptée d'un droit, avec ses jours pris et prévus. */
export type AbsenceDecomptee<T extends SaisieEvenement> = { saisie: T; pris: number; prevus: number };

export type EtatSolde = "disponible" | "epuise" | "depasse";

/** Jour suivant (AAAA-MM-JJ), sans effet de fuseau. */
function jourSuivant(jour: string): string {
  const date = new Date(`${jour}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Jours d'une absence décomptés de ce droit : journées entières, dans la période, hors repos. */
export function joursDecomptes(saisie: SaisieEvenement, periode: Pick<PeriodeDroit, "debut" | "fin">, estRepos: (jour: string) => boolean): string[] {
  if (saisie.debutMinutes !== null) return [];
  const debut = saisie.debut > periode.debut ? saisie.debut : periode.debut;
  const fin = saisie.fin < periode.fin ? saisie.fin : periode.fin;
  const jours: string[] = [];
  for (let jour = debut; jour <= fin; jour = jourSuivant(jour)) {
    if (!estRepos(jour)) jours.push(jour);
  }
  return jours;
}

/** Bilan d'un droit et détail des absences qui le consomment (celles sans jour décompté sont écartées). */
export function bilanDroit<T extends SaisieEvenement>(
  droit: PeriodeDroit,
  saisies: readonly T[],
  aujourdhui: string,
  estRepos: (jour: string) => boolean,
): BilanDroit & { absences: AbsenceDecomptee<T>[] } {
  const absences: AbsenceDecomptee<T>[] = [];
  for (const saisie of saisies) {
    const jours = joursDecomptes(saisie, droit, estRepos);
    if (jours.length === 0) continue;
    const pris = jours.filter((jour) => jour <= aujourdhui).length;
    absences.push({ saisie, pris, prevus: jours.length - pris });
  }
  const acquis = droit.joursReliquat + droit.joursAcquis;
  const pris = absences.reduce((total, absence) => total + absence.pris, 0);
  const prevus = absences.reduce((total, absence) => total + absence.prevus, 0);
  return { acquis, pris, prevus, soldeAujourdhui: acquis - pris, soldePrevisionnel: acquis - pris - prevus, absences };
}

/** État du solde prévisionnel, pour l'étiquette de la carte. */
export function etatSolde(soldePrevisionnel: number): EtatSolde {
  if (soldePrevisionnel < 0) return "depasse";
  return soldePrevisionnel === 0 ? "epuise" : "disponible";
}

/** Part de l'acquis déjà consommée (pris + prévus), de 0 à 100, pour la barre de progression. */
export function pourcentageConsomme(bilan: Pick<BilanDroit, "acquis" | "pris" | "prevus">): number {
  if (bilan.acquis <= 0) return bilan.pris + bilan.prevus > 0 ? 100 : 0;
  return Math.min(100, Math.round(((bilan.pris + bilan.prevus) / bilan.acquis) * 100));
}

/** Vrai si le nombre est un nombre de jours valable : de 0 au maximum, par demi-journée. */
export function estNombreDeJoursValide(jours: number, maximum: number): boolean {
  return Number.isFinite(jours) && jours >= 0 && jours <= maximum && Number.isInteger(jours * 2);
}

/** Année si la période couvre exactement une année civile (1er janvier au 31 décembre), sinon null. */
export function anneeCivile(debut: string, fin: string): number | null {
  const annee = debut.slice(0, 4);
  return debut === `${annee}-01-01` && fin === `${annee}-12-31` ? Number(annee) : null;
}
