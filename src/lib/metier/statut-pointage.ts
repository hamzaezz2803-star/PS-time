/**
 * Statut d'un pointage d'après le planning de l'employé (affectation, rotation, calendrier) :
 * à l'heure, en retard, départ anticipé, heures supplémentaires, pause, hors fenêtre, repos...
 * Fonctions pures, testées dans statut-pointage.test.ts.
 */
import type { Calendrier } from "../../types/index.ts";
import { jourEtMinuteLocaux, jourPrecedent } from "./dates.ts";
import { planningDuJour, type DonneesPlanning } from "./planning-jour.ts";
import { MINUTES_PAR_JOUR } from "./programme.ts";

export type EtatPointageEvalue = "entree" | "sortie" | "debut_pause" | "fin_pause" | "debut_heures_sup" | "fin_heures_sup";

export type CodeStatut =
  | "aucun_planning"
  | "jour_repos"
  | "hors_fenetre"
  | "a_l_heure"
  | "retard"
  | "depart_anticipe"
  | "heures_sup"
  | "pause_non_prevue"
  | "pause_anticipee"
  | "retour_pause_retard"
  | "conforme"
  | "heures_sup_non_prevues"
  | "avant_fin_service";

/** Résultat : code, écart en minutes s'il y a lieu, et service de référence (jour où il commence). */
export type StatutPointage = { code: CodeStatut; minutes?: number; calendrier?: Calendrier; jourService?: string };

/** Service situé sur l'axe des minutes du jour du pointage (négatif = commencé la veille). */
type Service = { calendrier: Calendrier; jour: string; debut: number; fin: number };

function placerService(calendrier: Calendrier, jour: string, decalage: number): Service {
  const fin = calendrier.finMinutes < calendrier.debutMinutes ? calendrier.finMinutes + MINUTES_PAR_JOUR : calendrier.finMinutes;
  return { calendrier, jour, debut: calendrier.debutMinutes + decalage, fin: fin + decalage };
}

/**
 * Minutes acceptées après la fin pour une sortie. Avec les heures supplémentaires, la fenêtre
 * s'étend au-delà du plafond (ou d'une demi-journée sans plafond) pour ne pas couper les heures faites.
 */
function sortieAccepteeApres(c: Calendrier): number {
  if (!c.heuresSupActives) return c.sortieApresMinutes;
  const plafond = c.heuresSupMaximumMinutes > 0 ? c.heuresSupMaximumMinutes : MINUTES_PAR_JOUR / 2;
  // Le plafond, puis la fenêtre de sortie habituelle : une sortie au-delà du plafond reste comptée (plafonnée).
  return c.heuresSupApresMinutes + plafond + c.sortieApresMinutes;
}

const dansFenetres = (s: Service, minute: number) =>
  minute >= s.debut - s.calendrier.entreeAvantMinutes && minute <= s.fin + sortieAccepteeApres(s.calendrier);

/**
 * Service auquel se rattache le pointage : celui du jour, ou le service de nuit commencé la veille
 * si le pointage tombe dans ses fenêtres (ex. sortie à 06:00 d'un service 22:00 à 06:00).
 */
function serviceDuPointage(employe: { id: string; groupeId: string | null }, jour: string, minute: number, donnees: DonneesPlanning) {
  const veille = jourPrecedent(jour);
  const planningVeille = planningDuJour(employe, veille, donnees);
  if (planningVeille.type === "travail") {
    const service = placerService(planningVeille.calendrier, veille, -MINUTES_PAR_JOUR);
    if (service.fin > 0 && dansFenetres(service, minute)) return { planning: planningVeille, service };
  }
  const planning = planningDuJour(employe, jour, donnees);
  return { planning, service: planning.type === "travail" ? placerService(planning.calendrier, jour, 0) : null };
}

function statutEntree(s: Service, minute: number): StatutPointage {
  const c = s.calendrier;
  if (minute < s.debut - c.entreeAvantMinutes || minute > s.debut + c.entreeApresMinutes) return { code: "hors_fenetre" };
  const retard = minute - s.debut;
  return retard > c.retardTolereMinutes ? { code: "retard", minutes: retard } : { code: "a_l_heure" };
}

function statutSortie(s: Service, minute: number): StatutPointage {
  const c = s.calendrier;
  if (minute < s.fin - c.sortieAvantMinutes || minute > s.fin + sortieAccepteeApres(c)) return { code: "hors_fenetre" };
  const avance = s.fin - minute;
  if (avance > c.departAnticipeTolereMinutes) return { code: "depart_anticipe", minutes: avance };
  const supplementaires = minute - s.fin - c.heuresSupApresMinutes;
  if (c.heuresSupActives && supplementaires > 0 && supplementaires >= c.heuresSupMinimumMinutes) {
    const plafond = c.heuresSupMaximumMinutes > 0 ? c.heuresSupMaximumMinutes : Infinity;
    return { code: "heures_sup", minutes: Math.min(supplementaires, plafond) };
  }
  return { code: "a_l_heure" };
}

/** Début et fin de la pause sur le même axe que le service (une pause de nuit peut être après minuit). */
function pauseDuService(s: Service): { debut: number; fin: number } | null {
  const { pauseDebutMinutes: debut, pauseFinMinutes: fin, debutMinutes } = s.calendrier;
  if (debut === null || fin === null) return null;
  const decalage = s.debut - debutMinutes;
  const debutPause = (debut < debutMinutes ? debut + MINUTES_PAR_JOUR : debut) + decalage;
  const finPause = debutPause + ((fin - debut + MINUTES_PAR_JOUR) % MINUTES_PAR_JOUR);
  return { debut: debutPause, fin: finPause };
}

function statutPause(s: Service, minute: number, estDebut: boolean): StatutPointage {
  const pause = pauseDuService(s);
  if (!pause) return { code: "pause_non_prevue" };
  if (minute < s.debut || minute > s.fin) return { code: "hors_fenetre" };
  if (estDebut && minute < pause.debut) return { code: "pause_anticipee", minutes: pause.debut - minute };
  if (!estDebut && minute > pause.fin) return { code: "retour_pause_retard", minutes: minute - pause.fin };
  return { code: "conforme" };
}

function statutHeuresSup(s: Service, minute: number): StatutPointage {
  if (!s.calendrier.heuresSupActives) return { code: "heures_sup_non_prevues" };
  return minute < s.fin ? { code: "avant_fin_service", minutes: s.fin - minute } : { code: "conforme" };
}

/** Statut d'un pointage (instant UTC) pour un employé, selon son planning, dans le fuseau de l'entreprise. */
export function statutPointage(
  pointage: { horodatage: Date; etat: EtatPointageEvalue },
  employe: { id: string; groupeId: string | null },
  donnees: DonneesPlanning,
  fuseau: string,
): StatutPointage {
  const { jour, minutes } = jourEtMinuteLocaux(pointage.horodatage, fuseau);
  const { planning, service } = serviceDuPointage(employe, jour, minutes, donnees);
  if (planning.type === "aucun") return { code: "aucun_planning" };
  if (!service) return { code: "jour_repos" };

  const resultat =
    pointage.etat === "entree" ? statutEntree(service, minutes)
    : pointage.etat === "sortie" ? statutSortie(service, minutes)
    : pointage.etat === "debut_pause" || pointage.etat === "fin_pause" ? statutPause(service, minutes, pointage.etat === "debut_pause")
    : statutHeuresSup(service, minutes);
  return { ...resultat, calendrier: service.calendrier, jourService: service.jour };
}
