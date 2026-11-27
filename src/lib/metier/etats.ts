/**
 * Menu État : liste des rapports et calculs qui leur sont propres (mêmes règles que les
 * statistiques et le Détail jour). Fonctions pures, testées dans etats.test.ts.
 */
import type { Page } from "./droits.ts";
import { resumerJour, type ResumeJour } from "./resume-jour.ts";
import { estEnPoste, evenementDuJour, evenementRetenuDuJour, statutDuJour, type EmployeStatistiques, type Maintenant, type StatutJour } from "./statistiques-presence.ts";

/** Rapports du menu État, dans l'ordre du menu (segment de l'adresse : /etats/<etat>). */
export const ETATS = ["presences", "evenements", "conges", "pointages-manuels"] as const;
export type Etat = (typeof ETATS)[number];

/** Page à accorder pour voir chaque état. */
export const PAGE_DE_L_ETAT = {
  presences: "etat_presences",
  evenements: "etat_evenements",
  conges: "etat_conges",
  "pointages-manuels": "etat_pointages",
} as const satisfies Record<Etat, Page>;

export const estEtat = (valeur: string): valeur is Etat => (ETATS as readonly string[]).includes(valeur);

/**
 * Statut écrit dans l'état : celui des statistiques (`statutDuJour`, qui fait les comptes),
 * précisé pour la lecture : un jour sans horaire est un repos (travaillé ou non) ou un jour sans
 * aucune affectation ; un événement de présence retenu (mission, formation) est dit comme tel.
 */
export type StatutEtat = Exclude<StatutJour, "sans_horaire"> | "evenement_presence" | "repos" | "repos_travaille" | "aucun_horaire";

export function statutEtat(resume: Pick<ResumeJour, "estSansPlanning" | "entree" | "evenement">, statut: StatutJour): StatutEtat {
  if (statut === "sans_horaire") {
    if (resume.estSansPlanning) return "aucun_horaire";
    return resume.entree === null ? "repos" : "repos_travaille";
  }
  if (statut === "a_l_heure" && resume.evenement?.type === "presence") return "evenement_presence";
  return statut;
}

export type LignePresence<E extends EmployeStatistiques> = { employe: E; resume: ResumeJour; statut: StatutEtat };

/**
 * État des présences : une ligne par employé et par jour où il était attendu, a pointé ou avait
 * un événement (période d'emploi seulement), du plus récent au plus ancien.
 */
export function lignesPresences<E extends EmployeStatistiques>(employes: readonly E[], maintenant: Maintenant): LignePresence<E>[] {
  const lignes: LignePresence<E>[] = [];
  for (const employe of employes) {
    const evenements = (employe.evenements ?? []).map((evenement) => ({ ...evenement, code: evenement.code ?? "", nom: evenement.nom ?? "" }));
    for (const journee of employe.jours) {
      if (!estEnPoste(employe, journee.jour)) continue;
      const resume = resumerJour(journee, evenements);
      if (!journee.horaire && journee.pointages.length === 0 && !resume.evenement) continue;
      const statut = statutDuJour(journee, maintenant, evenementDuJour(employe, journee.jour, journee.pointages.length > 0));
      lignes.push({ employe, resume, statut: statutEtat(resume, statut) });
    }
  }
  return lignes.sort((a, b) => b.resume.jour.localeCompare(a.resume.jour));
}

/**
 * Jours d'une saisie en journées entières (identifiée par `id`) dans la période chargée : jours
 * qu'elle couvre hors repos du planning (sans aucune affectation, chaque jour compte, comme pour
 * les droits aux congés), et parmi eux ceux où elle est retenue (« validés », ceux que décomptent
 * les droits aux congés).
 */
export function joursDeLaSaisie(employe: EmployeStatistiques, saisie: { id: string; debut: string; fin: string }): { prevus: number; valides: number } {
  let prevus = 0;
  let valides = 0;
  for (const journee of employe.jours) {
    const estRepos = !journee.horaire && !journee.estSansPlanning;
    if (estRepos || journee.jour < saisie.debut || journee.jour > saisie.fin) continue;
    prevus += 1;
    if (evenementRetenuDuJour(employe, journee.jour, journee.pointages.length > 0)?.id === saisie.id) valides += 1;
  }
  return { prevus, valides };
}
