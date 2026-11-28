/**
 * Variables des formules de compteurs, calculées pour une journée de service puis additionnées
 * sur la semaine ou le mois. Pas de service de nuit : la journée de service est le jour civil
 * (heure de Casablanca). Fonctions pures, testées dans variables.test.ts.
 * Libellés et règles affichés : lib/textes/variables-compteurs.ts.
 */
import type { ProfilHoraire } from "../../../types/index.ts";
import { NUIT_DEBUT_MINUTES, NUIT_FIN_MINUTES } from "../../constantes.ts";
import { theoriqueMinutes } from "../profil-horaire.ts";
import {
  AUCUN_CODE,
  minutesDeNuit,
  variablesDroitsDesCodes,
  variablesEvenementsDuJour,
  variablesJourDesCodes,
  type CodesCompteurs,
  type EvenementCompteur,
} from "./variables-evenements.ts";
import type { Periodicite } from "./periodes.ts";

export type UniteVariable = "minutes" | "nombre" | "jours";
type DefinitionVariable = { nom: string; unite: UniteVariable; periodicites: readonly Periodicite[] };

const TOUTES: readonly Periodicite[] = ["JOUR", "SEMAINE", "MOIS"];
const JOUR: readonly Periodicite[] = ["JOUR"];
const CUMULS: readonly Periodicite[] = ["SEMAINE", "MOIS"];

/** Registre des variables : nom, unité, périodicités où elles existent. */
export const VARIABLES_COMPTEURS = [
  { nom: "DUREE_PREVUE_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "DUREE_TRAVAILLEE_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "RETARD_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "AVANCE_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "DEPART_ANTICIPE_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "DEPASSEMENT_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "NB_POINTAGES", unite: "nombre", periodicites: TOUTES },
  { nom: "DUREE_NUIT_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "DUREE_ABSENCE_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "DUREE_EVT_PRESENCE_MIN", unite: "minutes", periodicites: TOUTES },
  { nom: "JOURS_ABSENCE", unite: "jours", periodicites: TOUTES },
  { nom: "A_HORAIRE", unite: "nombre", periodicites: JOUR },
  { nom: "PRESENT", unite: "nombre", periodicites: JOUR },
  { nom: "NB_JOURS", unite: "jours", periodicites: CUMULS },
  { nom: "NB_JOURS_PLANIFIES", unite: "jours", periodicites: CUMULS },
  { nom: "NB_JOURS_TRAVAILLES", unite: "jours", periodicites: CUMULS },
  { nom: "NB_ABSENCES", unite: "jours", periodicites: CUMULS },
  { nom: "NB_JOURS_INCOMPLETS", unite: "jours", periodicites: CUMULS },
] as const satisfies readonly DefinitionVariable[];

/** Noms des variables utilisables pour une périodicité. */
export function variablesPour(periodicite: Periodicite, codes: CodesCompteurs = AUCUN_CODE): string[] {
  const fixes = VARIABLES_COMPTEURS.filter((variable) => (variable.periodicites as readonly Periodicite[]).includes(periodicite)).map((variable) => variable.nom);
  return [...fixes, ...variablesJourDesCodes(codes), ...variablesDroitsDesCodes(codes)];
}

export type ValeursVariables = Record<string, number | null>;

/** Horaire prévu d'une journée, en minutes depuis minuit. */
export type HorairePrevu = { debutPrevu: number; finPrevue: number; dureePrevue: number; estBadge: boolean };

/** Journée de service : horaire prévu (null = repos ou aucun planning) et pointages (minutes locales). */
export type JourService = {
  jour: string;
  horaire: HorairePrevu | null;
  pointages: number[];
  /** Profil appliqué, pour l'affichage (absent dans les calculs purs). */
  profil?: { code: string; nom: string; estDynamique: boolean } | null;
  /** Aucune affectation ne couvre ce jour (ni rotation, ni horaire dynamique) : ce n'est pas un repos. */
  estSansPlanning?: boolean;
  /** Événements de l'employé qui touchent le jour ; absent = non chargés (variables d'événement inconnues). */
  evenements?: readonly EvenementCompteur[];
};

/** Jour de repos du planning (rotation ou profil Repos), à ne pas confondre avec un jour sans aucune affectation. */
export const estJourDeRepos = (journee: Pick<JourService, "horaire" | "estSansPlanning">): boolean => !journee.horaire && journee.estSansPlanning !== true;

/** Horaire prévu d'un profil de travail : de la première à la dernière plage fixe ; durée = somme des plages fixes. */
export function horaireDuProfil(profil: ProfilHoraire): HorairePrevu | null {
  const fixes = profil.plages.filter((plage) => plage.type === "fixe");
  if (fixes.length === 0) return null;
  return {
    debutPrevu: Math.min(...fixes.map((plage) => plage.debut)),
    finPrevue: Math.max(...fixes.map((plage) => plage.fin)),
    dureePrevue: theoriqueMinutes(profil.plages),
    estBadge: profil.estBadge,
  };
}

const partiePositive = (valeur: number) => Math.max(0, valeur);

/** Entrée et sortie retenues ; un profil non badgé est considéré présent aux heures prévues. */
export function entreeSortie({ horaire, pointages }: JourService): { entree: number | null; sortie: number | null } {
  if (horaire && !horaire.estBadge) return { entree: horaire.debutPrevu, sortie: horaire.finPrevue };
  const tries = [...pointages].sort((a, b) => a - b);
  const entree = tries[0] ?? null;
  const sortie = tries.length >= 2 ? tries[tries.length - 1] : null;
  return { entree, sortie: sortie !== null && sortie > (entree ?? sortie) ? sortie : null };
}

/**
 * Variables d'une journée. Une valeur inconnue vaut null, jamais 0. `codes` : codes d'événements
 * qui donnent JOURS_<code> et MIN_<code>.
 */
export function variablesDuJour(jour: JourService, codes: CodesCompteurs = AUCUN_CODE): ValeursVariables {
  const { horaire } = jour;
  const { entree, sortie } = entreeSortie(jour);
  const ecart = (calcul: (h: HorairePrevu, minute: number) => number, minute: number | null) =>
    horaire && minute !== null ? partiePositive(calcul(horaire, minute)) : null;
  return {
    DUREE_PREVUE_MIN: horaire ? horaire.dureePrevue : null,
    DUREE_TRAVAILLEE_MIN: entree !== null && sortie !== null ? sortie - entree : null,
    RETARD_MIN: ecart((h, minute) => minute - h.debutPrevu, entree),
    AVANCE_MIN: ecart((h, minute) => h.debutPrevu - minute, entree),
    DEPART_ANTICIPE_MIN: ecart((h, minute) => h.finPrevue - minute, sortie),
    DEPASSEMENT_MIN: ecart((h, minute) => minute - h.finPrevue, sortie),
    NB_POINTAGES: jour.pointages.length,
    A_HORAIRE: horaire ? 1 : 0,
    PRESENT: entree !== null ? 1 : 0,
    DUREE_NUIT_MIN: minutesDeNuit(entree, sortie, NUIT_FIN_MINUTES, NUIT_DEBUT_MINUTES),
    ...variablesEvenementsDuJour(
      { jour: jour.jour, dureePrevue: horaire ? horaire.dureePrevue : null, aPointe: jour.pointages.length > 0, estRepos: estJourDeRepos(jour), evenements: jour.evenements },
      codes,
    ),
  };
}

/** Variables qui existent pour un jour et pour un cumul : elles s'additionnent jour après jour. */
const VARIABLES_ADDITIONNEES = VARIABLES_COMPTEURS.filter((variable) => (variable.periodicites as readonly Periodicite[]).length === TOUTES.length).map(
  (variable) => variable.nom,
);

/** Variables d'une semaine ou d'un mois à partir des variables de ses jours écoulés. */
export function agregerJours(jours: readonly ValeursVariables[], codes: CodesCompteurs = AUCUN_CODE): ValeursVariables {
  const resultat: ValeursVariables = {};
  for (const nom of [...VARIABLES_ADDITIONNEES, ...variablesJourDesCodes(codes)]) {
    const connues = jours.map((jour) => jour[nom]).filter((valeur): valeur is number => valeur !== null && valeur !== undefined);
    resultat[nom] = connues.length > 0 ? connues.reduce((total, valeur) => total + valeur, 0) : null;
  }
  const compter = (condition: (jour: ValeursVariables) => boolean) => jours.filter(condition).length;
  resultat.NB_JOURS = jours.length;
  resultat.NB_JOURS_PLANIFIES = compter((jour) => jour.A_HORAIRE === 1);
  resultat.NB_JOURS_TRAVAILLES = compter((jour) => jour.PRESENT === 1);
  resultat.NB_ABSENCES = compter((jour) => jour.A_HORAIRE === 1 && jour.PRESENT === 0);
  resultat.NB_JOURS_INCOMPLETS = compter((jour) => jour.PRESENT === 1 && jour.DUREE_TRAVAILLEE_MIN === null);
  return resultat;
}
