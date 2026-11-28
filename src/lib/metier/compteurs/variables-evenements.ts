/**
 * Variables d'une journée tirées des événements (Absences et événements) : durée d'absence, durée
 * d'événement de présence (mission, formation), jour d'absence retenu, et par code d'événement
 * JOURS_<code> et MIN_<code>. Fonctions pures, testées dans variables-evenements.test.ts.
 *
 * Règles (les mêmes que le statut du jour) : parmi les événements en journées entières, un seul est
 * retenu (`evenementRetenu` : pointage, priorité, repos) et compte pour la durée prévue du jour ; une
 * saisie en heures compte toujours pour ses heures. Un jour retenu sans horaire prévu (aucune
 * affectation) a une durée inconnue (null, jamais 0).
 */
import { evenementRetenu, type EvenementCandidat, type SaisieEvenement } from "../evenements.ts";

/** Valeurs des variables (null = donnée inconnue, jamais remplacée par 0). */
type ValeursVariables = Record<string, number | null>;

/**
 * Codes des événements de l'installation, qui donnent des variables propres à chacun :
 * JOURS_<code> et MIN_<code> pour tout événement, PRIS_<code> et SOLDE_<code> pour un événement
 * soumis à la gestion des droits (droits aux congés).
 */
export type CodesCompteurs = { evenements: readonly string[]; droits: readonly string[] };
export const AUCUN_CODE: CodesCompteurs = { evenements: [], droits: [] };

export const variableJours = (code: string) => `JOURS_${code}`;
export const variableMinutes = (code: string) => `MIN_${code}`;
export const variablePris = (code: string) => `PRIS_${code}`;
export const variableSolde = (code: string) => `SOLDE_${code}`;

/** Variables d'événement d'une journée (additionnées sur la semaine et le mois). */
export const variablesJourDesCodes = (codes: CodesCompteurs) => codes.evenements.flatMap((code) => [variableJours(code), variableMinutes(code)]);
/** Variables des droits aux congés : un état à la fin de la période, jamais additionné. */
export const variablesDroitsDesCodes = (codes: CodesCompteurs) => codes.droits.flatMap((code) => [variablePris(code), variableSolde(code)]);

/** Codes utilisés par le calcul et la vérification des formules. */
export const codesDesEvenements = (liste: readonly { code: string; estSoumisDroits: boolean }[]): CodesCompteurs => ({
  evenements: liste.map((evenement) => evenement.code),
  droits: liste.filter((evenement) => evenement.estSoumisDroits).map((evenement) => evenement.code),
});

export type EvenementCompteur = EvenementCandidat & SaisieEvenement & { code: string; type: "absence" | "presence" };

type JourneeEvenements = { jour: string; dureePrevue: number | null; aPointe: boolean; estRepos: boolean; evenements: readonly EvenementCompteur[] };

/** Ajoute des minutes à un total ; une durée inconnue rend le total inconnu. */
const ajouter = (total: number | null, minutes: number | null) => (total === null || minutes === null ? null : total + minutes);

/** Événement retenu en journée entière et saisies en heures de la journée. */
function evenementsDeLaJournee({ jour, aPointe, estRepos, evenements }: JourneeEvenements) {
  const entieres = evenements.filter((evenement) => evenement.debutMinutes === null && evenement.debut <= jour && jour <= evenement.fin);
  const enHeures = evenements.filter((evenement) => evenement.debutMinutes !== null && evenement.finMinutes !== null && evenement.debut === jour);
  return { retenu: evenementRetenu(entieres, aPointe, estRepos), enHeures };
}

/** Minutes d'événements de la journée qui répondent au filtre (retenu en journée entière + saisies en heures). */
function minutesSelon(journee: JourneeEvenements, filtre: (evenement: EvenementCompteur) => boolean): number | null {
  const { retenu, enHeures } = evenementsDeLaJournee(journee);
  let total: number | null = retenu && filtre(retenu) ? journee.dureePrevue : 0;
  for (const saisie of enHeures.filter(filtre)) total = ajouter(total, (saisie.finMinutes ?? 0) - (saisie.debutMinutes ?? 0));
  return total;
}

/** Variables d'événement d'une journée ; `evenements` absent (non chargés) : toutes inconnues. */
export function variablesEvenementsDuJour(journee: Omit<JourneeEvenements, "evenements"> & { evenements?: readonly EvenementCompteur[] }, codes: CodesCompteurs): ValeursVariables {
  const { evenements } = journee;
  const noms = ["DUREE_ABSENCE_MIN", "DUREE_EVT_PRESENCE_MIN", "JOURS_ABSENCE", ...variablesJourDesCodes(codes)];
  if (!evenements) return Object.fromEntries(noms.map((nom) => [nom, null]));

  const complete = { ...journee, evenements };
  const { retenu } = evenementsDeLaJournee(complete);
  const valeurs: ValeursVariables = {
    DUREE_ABSENCE_MIN: minutesSelon(complete, (evenement) => evenement.type === "absence"),
    DUREE_EVT_PRESENCE_MIN: minutesSelon(complete, (evenement) => evenement.type === "presence"),
    JOURS_ABSENCE: retenu?.type === "absence" ? 1 : 0,
  };
  for (const code of codes.evenements) {
    valeurs[variableJours(code)] = retenu?.code === code ? 1 : 0;
    valeurs[variableMinutes(code)] = minutesSelon(complete, (evenement) => evenement.code === code);
  }
  return valeurs;
}

/** Minutes de présence (de l'entrée à la sortie) comprises dans la nuit : avant 6 h et après 21 h. */
export function minutesDeNuit(entree: number | null, sortie: number | null, finMatin: number, debutSoir: number): number | null {
  if (entree === null || sortie === null) return null;
  const chevauchement = (debut: number, fin: number) => Math.max(0, Math.min(sortie, fin) - Math.max(entree, debut));
  return chevauchement(0, finMatin) + chevauchement(debutSoir, 24 * 60);
}
