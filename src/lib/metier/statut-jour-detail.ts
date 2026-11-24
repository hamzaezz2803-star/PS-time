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
  | "repos_travaille";

export function statutJourDetail(jour: Pick<ResumeJour, "profilCode" | "entree" | "sortie" | "retardMinutes" | "evenement">): StatutJourDetail {
  if (jour.evenement) return jour.evenement.type === "presence" ? "evenement_presence" : "absence_justifiee";
  if (jour.profilCode === null) return jour.entree === null ? "repos" : "repos_travaille";
  if (jour.entree === null) return "sans_pointage";
  if (jour.sortie === null) return "incomplet";
  return (jour.retardMinutes ?? 0) > 0 ? "retard" : "a_l_heure";
}
