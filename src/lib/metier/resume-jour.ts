/**
 * Résumé d'une journée pour le Détail jour (historique et détail d'un compteur de la semaine ou
 * du mois) : horaire, entrée, sortie, temps travaillé, retard et événement retenu. Fonction pure,
 * testée dans resume-jour.test.ts ; mêmes règles que les compteurs et les statistiques.
 */
import { entreeSortie, estJourDeRepos, variablesDuJour, type JourService, type ValeursVariables } from "./compteurs/variables.ts";
import { evenementRetenu, type EvenementCandidat } from "./evenements.ts";

/** Événement en journées entières de l'employé, avec ce qui le départage des autres. */
export type EvenementPeriode = EvenementCandidat & { code: string; nom: string; type: "absence" | "presence"; debut: string; fin: string };

export type EvenementResume = Pick<EvenementPeriode, "code" | "nom" | "type">;

export type ResumeJour = {
  jour: string;
  /** Code du profil appliqué, ou null un jour de repos (ou sans planning). */
  profilCode: string | null;
  /** Aucune affectation ce jour-là : « Aucun horaire », à ne pas confondre avec un repos. */
  estSansPlanning: boolean;
  entree: number | null;
  sortie: number | null;
  travailleMinutes: number | null;
  retardMinutes: number | null;
  /** Événement retenu ce jour-là (priorité, pointages), ou null. */
  evenement: EvenementResume | null;
  /** Événements du jour qui ne l'emportent pas (« non validés »). */
  nonValides: EvenementResume[];
};

const resumeEvenement = ({ code, nom, type }: EvenementPeriode): EvenementResume => ({ code, nom, type });

/**
 * Journée telle qu'elle compte une fois l'événement retenu connu : un profil non badgé présume
 * la présence aux heures prévues, sauf un jour d'absence retenue (congé, maladie...), où rien
 * n'est présumé (sinon l'employé serait à la fois absent et présent 4 h).
 */
export function journeeSelonEvenement(journee: JourService, typeRetenu: EvenementPeriode["type"] | null): JourService {
  if (typeRetenu !== "absence" || !journee.horaire || journee.horaire.estBadge) return journee;
  return { ...journee, horaire: { ...journee.horaire, estBadge: true } };
}

/**
 * Variables d'une journée selon l'événement retenu : pas de présence présumée un jour d'absence
 * retenue, et pas de retard un jour d'événement de présence retenu (mission, formation : la
 * journée est justifiée ; décision du responsable du 27/11/2026).
 */
export function variablesSelonEvenement(journee: JourService, typeRetenu: EvenementPeriode["type"] | null): ValeursVariables {
  const valeurs = variablesDuJour(journeeSelonEvenement(journee, typeRetenu));
  return typeRetenu === "presence" ? { ...valeurs, RETARD_MIN: null } : valeurs;
}

export function resumerJour(journee: JourService, evenements: readonly EvenementPeriode[]): ResumeJour {
  const duJour = evenements.filter((evenement) => evenement.debut <= journee.jour && journee.jour <= evenement.fin);
  const retenu = evenementRetenu(duJour, journee.pointages.length > 0, estJourDeRepos(journee));
  const valeurs = variablesSelonEvenement(journee, retenu?.type ?? null);
  const { entree, sortie } = entreeSortie(journeeSelonEvenement(journee, retenu?.type ?? null));
  return {
    jour: journee.jour,
    profilCode: journee.horaire ? (journee.profil?.code ?? null) : null,
    estSansPlanning: journee.estSansPlanning === true,
    entree,
    sortie,
    travailleMinutes: valeurs.DUREE_TRAVAILLEE_MIN,
    retardMinutes: valeurs.RETARD_MIN,
    evenement: retenu ? resumeEvenement(retenu) : null,
    nonValides: duJour.filter((evenement) => evenement !== retenu).map(resumeEvenement),
  };
}
