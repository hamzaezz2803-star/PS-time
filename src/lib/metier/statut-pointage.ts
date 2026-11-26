/**
 * Résultat d'un pointage d'après le planning de l'employé (affectation, rotation, profil horaire) :
 * plage où il tombe, point validé (heure retenue), retard, départ anticipé, pause...
 * Fonctions pures, testées dans statut-pointage.test.ts.
 */
import type { ProfilHoraire } from "../../types/index.ts";
import { jourEtMinuteLocaux } from "./dates.ts";
import { planningDuJour, type DonneesPlanning } from "./planning-jour.ts";
import { plageDuPointage, pointValide, type Sens } from "./profil-horaire.ts";

export type EtatPointageEvalue = "entree" | "sortie" | "debut_pause" | "fin_pause" | "debut_mission" | "fin_mission" | "debut_heures_sup" | "fin_heures_sup";

export type CodeStatut =
  | "aucun_planning"
  | "jour_repos"
  | "non_badge"
  | "plage_interdite"
  | "plage_neutralisee"
  | "a_l_heure"
  | "retard_tolere"
  | "retard"
  | "depart_anticipe"
  | "pause_non_prevue"
  | "pause_anticipee"
  | "retour_pause_retard"
  | "conforme";

/** Résultat : code, écart en minutes s'il y a lieu, profil de référence et point validé (minutes). */
export type StatutPointage = { code: CodeStatut; minutes?: number; profil?: ProfilHoraire; pointValide?: number };

/** Une entrée, un retour de pause, un début de mission ou d'heures sup. est une arrivée ; le reste, un départ. */
const SENS: Record<EtatPointageEvalue, Sens> = {
  entree: "arrivee",
  fin_pause: "arrivee",
  debut_mission: "arrivee",
  debut_heures_sup: "arrivee",
  sortie: "depart",
  debut_pause: "depart",
  fin_mission: "depart",
  fin_heures_sup: "depart",
};

/** Résultat selon la plage où tombe le pointage, pour un profil de travail badgé. */
function statutDansProfil(profil: ProfilHoraire, etat: EtatPointageEvalue, minute: number): StatutPointage {
  const sens = SENS[etat];
  const plage = plageDuPointage(profil.plages, minute, sens);
  if (!plage || plage.type === "interdite") return { code: "plage_interdite" };
  const valide = pointValide(profil.plages, minute, sens) ?? undefined;
  const avecPoint = (code: CodeStatut, minutes?: number): StatutPointage => ({ code, minutes, pointValide: valide });

  if (plage.type === "neutralisee") return avecPoint("plage_neutralisee");
  if (etat === "debut_pause" && !profil.plages.some((p) => p.type === "repas")) return avecPoint("pause_non_prevue");

  // Dans une plage fixe, l'employé doit être là : arriver est un retard, partir une avance
  // (pile sur la borne, l'écart est nul : c'est à l'heure).
  const ecart = plage.type !== "fixe" ? 0 : sens === "arrivee" ? minute - plage.debut : plage.fin - minute;
  if (ecart > 0 && sens === "arrivee") return avecPoint(etat === "fin_pause" ? "retour_pause_retard" : "retard", ecart);
  if (ecart > 0) return avecPoint(etat === "debut_pause" ? "pause_anticipee" : "depart_anticipe", ecart);
  if (plage.type === "retard_tolere" && sens === "arrivee") return avecPoint("retard_tolere", minute - plage.debut);
  return avecPoint(etat === "entree" || etat === "sortie" ? "a_l_heure" : "conforme");
}

/** Résultat d'un pointage (instant UTC) pour un employé, selon son planning, dans le fuseau de l'entreprise. */
export function statutPointage(
  pointage: { horodatage: Date; etat: EtatPointageEvalue },
  employe: { id: string; groupeId: string | null },
  donnees: DonneesPlanning,
  fuseau: string,
): StatutPointage {
  const { jour, minutes } = jourEtMinuteLocaux(pointage.horodatage, fuseau);
  const planning = planningDuJour(employe, jour, donnees);
  if (planning.type === "aucun") return { code: "aucun_planning" };
  if (planning.type === "repos") return { code: "jour_repos", profil: planning.profil ?? undefined };
  if (!planning.profil.estBadge) return { code: "non_badge", profil: planning.profil };
  return { ...statutDansProfil(planning.profil, pointage.etat, minutes), profil: planning.profil };
}
