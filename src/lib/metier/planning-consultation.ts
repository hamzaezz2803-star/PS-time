/**
 * Consultation > Planning (sur le modèle de Gestor) : une journée du planning d'un employé, ses
 * anomalies, la grille d'un mois (semaines du lundi au dimanche) et les totaux. Fonctions pures,
 * testées dans planning-consultation.test.ts ; mêmes règles que les compteurs et le Détail jour.
 */
import { ajouterJours } from "./compteurs/periodes.ts";
import type { JourService } from "./compteurs/variables.ts";
import { resumerJour, type EvenementPeriode, type ResumeJour } from "./resume-jour.ts";

/** Anomalie d'une journée passée : signalée par une étoile, comme dans Gestor. */
export type Anomalie = "absence" | "retard" | "sortie_manquante";

export type JourPlanning = ResumeJour & {
  /** Théorique du profil (somme des plages fixes), ou null un jour de repos. */
  theoriqueMinutes: number | null;
  /** Un événement saisi en heures touche ce jour (cadre en pointillé). */
  aEvenementEnHeures: boolean;
  estFutur: boolean;
  anomalies: Anomalie[];
};

/** Anomalies d'une journée : seulement pour un jour passé (aujourd'hui n'est pas terminé), sauf le retard. */
export function anomaliesDuJour(journee: JourService, resume: ResumeJour, aujourdhui: string): Anomalie[] {
  if (journee.jour > aujourdhui) return [];
  const anomalies: Anomalie[] = [];
  const estPasse = journee.jour < aujourdhui;
  const estBadge = journee.horaire?.estBadge === true;
  if (estPasse && estBadge && journee.pointages.length === 0 && !resume.evenement) anomalies.push("absence");
  if ((resume.retardMinutes ?? 0) > 0) anomalies.push("retard");
  if (estPasse && estBadge && resume.entree !== null && resume.sortie === null) anomalies.push("sortie_manquante");
  return anomalies;
}

export function jourDePlanning(
  journee: JourService,
  evenements: readonly EvenementPeriode[],
  joursEnHeures: ReadonlySet<string>,
  aujourdhui: string,
): JourPlanning {
  const resume = resumerJour(journee, evenements);
  return {
    ...resume,
    theoriqueMinutes: journee.horaire?.dureePrevue ?? null,
    aEvenementEnHeures: joursEnHeures.has(journee.jour),
    estFutur: journee.jour > aujourdhui,
    anomalies: anomaliesDuJour(journee, resume, aujourdhui),
  };
}

/** Numéro de semaine ISO 8601 (la semaine 1 contient le premier jeudi de l'année). */
export function numeroSemaine(jour: string): number {
  const date = new Date(`${jour}T12:00:00Z`);
  const rangJour = (date.getUTCDay() + 6) % 7; // lundi = 0
  date.setUTCDate(date.getUTCDate() - rangJour + 3); // jeudi de la même semaine
  const premierJeudi = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const rangPremier = (premierJeudi.getUTCDay() + 6) % 7;
  premierJeudi.setUTCDate(premierJeudi.getUTCDate() - rangPremier + 3);
  return 1 + Math.round((date.getTime() - premierJeudi.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/** Premier et dernier jour d'un mois « AAAA-MM ». */
export function bornesDuMois(mois: string): { debut: string; fin: string } {
  const [annee, rang] = mois.split("-").map(Number);
  const nombreJours = new Date(Date.UTC(annee, rang, 0)).getUTCDate();
  return { debut: `${mois}-01`, fin: `${mois}-${String(nombreJours).padStart(2, "0")}` };
}

export type SemaineDuMois = { numero: number; debut: string; jours: (string | null)[] };

/** Semaines (lundi → dimanche) qui couvrent le mois ; les jours hors du mois valent null. */
export function semainesDuMois(mois: string): SemaineDuMois[] {
  const { debut, fin } = bornesDuMois(mois);
  const rangPremier = (new Date(`${debut}T12:00:00Z`).getUTCDay() + 6) % 7;
  const semaines: SemaineDuMois[] = [];
  for (let lundi = ajouterJours(debut, -rangPremier); lundi <= fin; lundi = ajouterJours(lundi, 7)) {
    const jours = Array.from({ length: 7 }, (_, rang) => ajouterJours(lundi, rang)).map((jour) => (jour >= debut && jour <= fin ? jour : null));
    semaines.push({ numero: numeroSemaine(lundi), debut: lundi, jours });
  }
  return semaines;
}

/** Mois voisin d'un mois « AAAA-MM » (-1 : précédent, +1 : suivant). */
export function moisVoisin(mois: string, decalage: number): string {
  const [annee, rang] = mois.split("-").map(Number);
  const date = new Date(Date.UTC(annee, rang - 1 + decalage, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type TotauxPlanning = {
  joursPlanifies: number;
  theoriqueMinutes: number;
  travailleMinutes: number;
  absences: number;
  retards: number;
  joursAvecEvenement: number;
};

/** Totaux d'une semaine, d'un mois ou d'une année : seules les valeurs connues sont additionnées. */
export function totaliser(jours: readonly JourPlanning[]): TotauxPlanning {
  return jours.reduce<TotauxPlanning>(
    (totaux, jour) => ({
      joursPlanifies: totaux.joursPlanifies + (jour.theoriqueMinutes !== null ? 1 : 0),
      theoriqueMinutes: totaux.theoriqueMinutes + (jour.theoriqueMinutes ?? 0),
      travailleMinutes: totaux.travailleMinutes + (jour.travailleMinutes ?? 0),
      absences: totaux.absences + (jour.anomalies.includes("absence") ? 1 : 0),
      retards: totaux.retards + (jour.anomalies.includes("retard") ? 1 : 0),
      joursAvecEvenement: totaux.joursAvecEvenement + (jour.evenement ? 1 : 0),
    }),
    { joursPlanifies: 0, theoriqueMinutes: 0, travailleMinutes: 0, absences: 0, retards: 0, joursAvecEvenement: 0 },
  );
}

/** Code affiché dans une case du planning : l'événement retenu, sinon le profil, sinon null (repos). */
export const codeDuJour = (jour: JourPlanning): string | null => jour.evenement?.code ?? jour.profilCode;

/** Samedi ou dimanche. */
export const estWeekEnd = (jour: string): boolean => [0, 6].includes(new Date(`${jour}T12:00:00Z`).getUTCDay());
