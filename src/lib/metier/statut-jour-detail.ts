/**
 * Statut d'une journée en un mot, pour lire l'historique du Détail jour d'un coup d'œil.
 * Fonction pure, testée dans statut-jour-detail.test.ts. L'événement reçu est déjà l'événement
 * retenu (un pointage l'emporte sur un événement qui ne neutralise pas le pointage).
 */
import type { ResumeJour } from "./resume-jour.ts";

export type StatutJourDetail =
  | "a_l_heure"
  | "retard"
  | "incomplet"
  | "sans_pointage"
  | "absence_justifiee"
  | "evenement_presence"
  | "repos"
  | "repos_travaille"
  | "en_cours"
  | "pas_encore_pointe";

/** Aujourd'hui, la journée n'est pas finie : pas encore de pointage, ou pas encore de sortie, n'est pas une anomalie. */
export function statutJourDetail(
  jour: Pick<ResumeJour, "profilCode" | "entree" | "sortie" | "retardMinutes" | "evenement">,
  estAujourdhui = false,
): StatutJourDetail {
  if (jour.evenement) return jour.evenement.type === "presence" ? "evenement_presence" : "absence_justifiee";
  if (jour.profilCode === null) return jour.entree === null ? "repos" : "repos_travaille";
  if (jour.entree === null) return estAujourdhui ? "pas_encore_pointe" : "sans_pointage";
  if (jour.sortie === null) return estAujourdhui ? "en_cours" : "incomplet";
  return (jour.retardMinutes ?? 0) > 0 ? "retard" : "a_l_heure";
}
