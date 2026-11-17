/**
 * Horaire dynamique : pour un employé qui l'a activé, le profil horaire du jour est reconnu
 * d'après l'heure de son premier pointage, grâce à des règles « fenêtre + jours → profil ».
 * Fonctions pures, testées dans horaire-dynamique.test.ts.
 */
import { jourDeSemaine } from "./programme.ts";

/** Jours de la semaine des règles : 1 = lundi … 7 = dimanche. */
export const JOURS_ISO = [1, 2, 3, 4, 5, 6, 7] as const;

export type RegleHoraire = {
  id: string;
  /** Fenêtre du premier pointage, en minutes depuis minuit (fin exclue). */
  debut: number;
  fin: number;
  jours: number[];
  profilId: string;
  estActif: boolean;
};

/** Garde les jours valides (1 à 7), sans doublon, triés ; aucun jour = tous les jours. */
export function normaliserJours(jours: readonly number[]): number[] {
  const valides = JOURS_ISO.filter((jour) => jours.includes(jour));
  return valides.length > 0 ? valides : [...JOURS_ISO];
}

/** [1, 2, 3] donne « 123 » (forme enregistrée en base). */
export const joursVersTexte = (jours: readonly number[]): string => normaliserJours(jours).join("");

/** « 135 » donne [1, 3, 5]. */
export const texteVersJours = (texte: string): number[] => normaliserJours([...texte].map(Number));

/** Jour ISO d'une date du calendrier (AAAA-MM-JJ) : lundi = 1 … dimanche = 7. */
export const jourIso = (jour: string): number => jourDeSemaine(jour) + 1;

/** Deux règles actives se chevauchent si leurs fenêtres se croisent un même jour. */
export function reglesSeChevauchent(a: RegleHoraire, b: RegleHoraire): boolean {
  if (!a.estActif || !b.estActif) return false;
  const fenetresCroisees = a.debut < b.fin && b.debut < a.fin;
  return fenetresCroisees && a.jours.some((jour) => b.jours.includes(jour));
}

/** Première règle existante (autre que `regle` elle-même) qui chevauche `regle`, ou null. */
export function regleEnConflit(regle: RegleHoraire, existantes: readonly RegleHoraire[]): RegleHoraire | null {
  return existantes.find((autre) => autre.id !== regle.id && reglesSeChevauchent(regle, autre)) ?? null;
}

/**
 * Règle qui reconnaît ce premier pointage (minute du jour) ce jour-là. Il en faut exactement une :
 * aucune ou plusieurs donnent null, pour ne jamais inventer ni deviner un horaire.
 */
export function regleReconnue(regles: readonly RegleHoraire[], jour: string, minutePremierPointage: number): RegleHoraire | null {
  const numero = jourIso(jour);
  const candidates = regles.filter(
    (regle) => regle.estActif && regle.jours.includes(numero) && regle.debut <= minutePremierPointage && minutePremierPointage < regle.fin,
  );
  return candidates.length === 1 ? candidates[0] : null;
}

/** Clé « employé + jour » de la table des premiers pointages. */
export const clePremierPointage = (employeId: string, jour: string): string => `${employeId}|${jour}`;

/**
 * Premier pointage (minute locale) de chaque employé pour chaque jour, à partir de pointages
 * déjà convertis dans le fuseau de l'entreprise.
 */
export function premiersPointages(pointages: readonly { employeId: string; jour: string; minutes: number }[]): Map<string, number> {
  const premiers = new Map<string, number>();
  for (const pointage of pointages) {
    const cle = clePremierPointage(pointage.employeId, pointage.jour);
    const actuel = premiers.get(cle);
    if (actuel === undefined || pointage.minutes < actuel) premiers.set(cle, pointage.minutes);
  }
  return premiers;
}
