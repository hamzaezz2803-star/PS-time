/**
 * Droits aux congés : droit, suppléments, consommation et soldes (d'après la « Gestion des
 * droits » de Gestor et la fiche du responsable). Fonctions pures, testées dans droits-conges.test.ts.
 *
 * Règles :
 * - total = reliquat + droit (jours acquis) + suppléments 1 à 3 + report de la période précédente ;
 * - unité : jours entiers, demi-journées ou heures (toutes les valeurs du droit dans cette unité) ;
 * - consomment le droit : les absences du même événement, pour leurs jours compris dans la période ;
 *   en jours, chaque jour d'absence en journée entière vaut 1 (0 un jour de repos du planning) ;
 *   en heures, il vaut la durée prévue par le planning, et une absence saisie en heures compte ses heures ;
 * - « pris » (consommé) : jours passés, aujourd'hui compris ; « prévus » : jours à venir déjà saisis ;
 * - un jour où l'événement n'est pas retenu (maladie plus prioritaire, pointage : voir
 *   evenementRetenu) vaut 0 : le congé reste « non validé » ce jour-là ;
 * - droit provisoire (non confirmé) : rien n'est encore utilisable (disponible = 0) ;
 * - report : le solde prévisionnel positif d'un droit avec « Report » s'ajoute au droit suivant du
 *   même employé et du même événement, s'il est dans la même unité.
 */
import type { SaisieEvenement } from "./evenements.ts";

export type UniteDroit = "journee" | "demi_journee" | "heures";

export type PeriodeDroit = {
  debut: string;
  fin: string;
  joursAcquis: number;
  joursReliquat: number;
  /** Somme des suppléments 1 à 3 (0 si aucun). */
  supplements?: number;
  unite?: UniteDroit;
  /** Faux : droit provisoire. Vrai par défaut. */
  estConfirme?: boolean;
  /** Solde reporté de la période précédente (calculé, jamais saisi). */
  report?: number;
};

export type BilanDroit = {
  /** Tout ce que prévoit le droit : reliquat + droit + suppléments + report. */
  total: number;
  /** Utilisable : le total, ou 0 pour un droit provisoire. */
  acquis: number;
  report: number;
  pris: number;
  prevus: number;
  soldeAujourdhui: number;
  soldePrevisionnel: number;
};

/** Absence décomptée d'un droit, avec ce qu'elle consomme (passé et à venir). */
export type AbsenceDecomptee<T extends SaisieEvenement> = { saisie: T; pris: number; prevus: number };

export type EtatSolde = "disponible" | "epuise" | "depasse";

/** Arrondi à 2 décimales (sommes d'heures). */
const arrondi = (valeur: number) => Math.round(valeur * 100) / 100;

/** Jour suivant (AAAA-MM-JJ), sans effet de fuseau. */
function jourSuivant(jour: string): string {
  const date = new Date(`${jour}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Jours d'une absence en journées entières compris dans la période, hors repos. */
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

/** Ce qu'une absence consomme du droit, réparti entre passé (pris) et à venir (prévus). */
function consommation(saisie: SaisieEvenement, droit: PeriodeDroit, aujourdhui: string, valeurJour: (jour: string) => number): { pris: number; prevus: number } {
  if (saisie.debutMinutes !== null && saisie.finMinutes !== null) {
    // Une saisie en heures ne compte que pour un droit en heures, et seulement dans la période.
    if (droit.unite !== "heures" || saisie.debut < droit.debut || saisie.debut > droit.fin) return { pris: 0, prevus: 0 };
    const heures = (saisie.finMinutes - saisie.debutMinutes) / 60;
    return saisie.debut <= aujourdhui ? { pris: heures, prevus: 0 } : { pris: 0, prevus: heures };
  }
  let pris = 0;
  let prevus = 0;
  for (const jour of joursDecomptes(saisie, droit, (candidat) => valeurJour(candidat) <= 0)) {
    if (jour <= aujourdhui) pris += valeurJour(jour);
    else prevus += valeurJour(jour);
  }
  return { pris: arrondi(pris), prevus: arrondi(prevus) };
}

/**
 * Bilan d'un droit et détail des absences qui le consomment (celles qui ne consomment rien sont
 * écartées). `valeurJour` : ce que vaut un jour d'absence entière (0 un jour de repos ; 1 en jours ;
 * la durée prévue en heures pour un droit en heures).
 */
export function bilanDroit<T extends SaisieEvenement>(
  droit: PeriodeDroit,
  saisies: readonly T[],
  aujourdhui: string,
  valeurJour: (jour: string) => number,
): BilanDroit & { absences: AbsenceDecomptee<T>[] } {
  const absences: AbsenceDecomptee<T>[] = [];
  for (const saisie of saisies) {
    const { pris, prevus } = consommation(saisie, droit, aujourdhui, valeurJour);
    if (pris + prevus > 0) absences.push({ saisie, pris, prevus });
  }
  const report = droit.report ?? 0;
  const total = arrondi(droit.joursReliquat + droit.joursAcquis + (droit.supplements ?? 0) + report);
  const acquis = droit.estConfirme === false ? 0 : total;
  const pris = arrondi(absences.reduce((somme, absence) => somme + absence.pris, 0));
  const prevus = arrondi(absences.reduce((somme, absence) => somme + absence.prevus, 0));
  return { total, acquis, report, pris, prevus, soldeAujourdhui: arrondi(acquis - pris), soldePrevisionnel: arrondi(acquis - pris - prevus), absences };
}

/** Droit d'une suite (même employé, même événement) pour le calcul des reports. */
export type DroitAReporter = {
  id: string;
  employeId: string;
  evenementId: string;
  debut: string;
  unite: UniteDroit;
  estReporte: boolean;
  estConfirme: boolean;
  /** Solde prévisionnel du droit, sans report reçu. */
  soldeSansReport: number;
};

/**
 * Report reçu par chaque droit : dans l'ordre des dates, le solde prévisionnel positif (report
 * compris) du droit précédent du même employé et événement, s'il a « Report », est confirmé et
 * compte dans la même unité. Les reports s'enchaînent d'année en année.
 */
export function calculerReports(droits: readonly DroitAReporter[]): Map<string, number> {
  const reports = new Map<string, number>();
  const tries = [...droits].sort((a, b) => a.debut.localeCompare(b.debut));
  const precedents = new Map<string, DroitAReporter>();
  for (const droit of tries) {
    const cle = `${droit.employeId}|${droit.evenementId}`;
    const precedent = precedents.get(cle);
    let report = 0;
    if (precedent && precedent.estReporte && precedent.estConfirme && precedent.unite === droit.unite) {
      report = Math.max(0, arrondi(precedent.soldeSansReport + (reports.get(precedent.id) ?? 0)));
    }
    reports.set(droit.id, report);
    precedents.set(cle, droit);
  }
  return reports;
}

/** État du solde prévisionnel, pour l'étiquette de la ligne. */
export function etatSolde(soldePrevisionnel: number): EtatSolde {
  if (soldePrevisionnel < 0) return "depasse";
  return soldePrevisionnel === 0 ? "epuise" : "disponible";
}

/** Part du total déjà consommée (pris + prévus), de 0 à 100, pour la barre de progression. */
export function pourcentageConsomme(bilan: Pick<BilanDroit, "acquis" | "pris" | "prevus">): number {
  if (bilan.acquis <= 0) return bilan.pris + bilan.prevus > 0 ? 100 : 0;
  return Math.min(100, Math.round(((bilan.pris + bilan.prevus) / bilan.acquis) * 100));
}

/** Vrai si le nombre est une valeur valable : de 0 au maximum, par demi-unité (demi-journée ou demi-heure). */
export function estNombreDeJoursValide(jours: number, maximum: number): boolean {
  return Number.isFinite(jours) && jours >= 0 && jours <= maximum && Number.isInteger(jours * 2);
}

/** Valeur valable pour l'unité : entière en jours, par demi-unité en demi-journées ou en heures. */
export function estValeurValidePourUnite(valeur: number, unite: UniteDroit, maximum: number): boolean {
  return estNombreDeJoursValide(valeur, maximum) && (unite !== "journee" || Number.isInteger(valeur));
}

/** Année si la période couvre exactement une année civile (1er janvier au 31 décembre), sinon null. */
export function anneeCivile(debut: string, fin: string): number | null {
  const annee = debut.slice(0, 4);
  return debut === `${annee}-01-01` && fin === `${annee}-12-31` ? Number(annee) : null;
}
