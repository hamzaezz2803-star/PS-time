/**
 * Résumé d'une journée pour le Détail jour (historique et détail d'un compteur de la semaine ou
 * du mois) : horaire, entrée, sortie, temps travaillé, retard et événement retenu. Fonction pure,
 * testée dans resume-jour.test.ts ; mêmes règles que les compteurs et les statistiques.
 */
import { entreeSortie, variablesDuJour, type JourService } from "./compteurs/variables.ts";
import { evenementRetenu, type EvenementCandidat } from "./evenements.ts";

/** Événement en journées entières de l'employé, avec ce qui le départage des autres. */
export type EvenementPeriode = EvenementCandidat & { code: string; nom: string; type: "absence" | "presence"; debut: string; fin: string };

export type EvenementResume = Pick<EvenementPeriode, "code" | "nom" | "type">;

export type ResumeJour = {
  jour: string;
  /** Code du profil appliqué, ou null un jour de repos (ou sans planning). */
  profilCode: string | null;
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

export function resumerJour(journee: JourService, evenements: readonly EvenementPeriode[]): ResumeJour {
  const valeurs = variablesDuJour(journee);
  const { entree, sortie } = entreeSortie(journee);
  const duJour = evenements.filter((evenement) => evenement.debut <= journee.jour && journee.jour <= evenement.fin);
  const retenu = evenementRetenu(duJour, journee.pointages.length > 0);
  return {
    jour: journee.jour,
    profilCode: journee.horaire ? (journee.profil?.code ?? null) : null,
    entree,
    sortie,
    travailleMinutes: valeurs.DUREE_TRAVAILLEE_MIN,
    retardMinutes: valeurs.RETARD_MIN,
    evenement: retenu ? resumeEvenement(retenu) : null,
    nonValides: duJour.filter((evenement) => evenement !== retenu).map(resumeEvenement),
  };
}
