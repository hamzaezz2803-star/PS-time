/** Libellés des statuts de pointage (comparaison avec le planning). */
import { formaterEcart, minutesVersHeure } from "@/lib/metier/programme";
import type { CodeStatut, StatutPointage } from "@/lib/metier/statut-pointage";

const LIBELLES: Record<CodeStatut, (ecart: string) => string> = {
  aucun_planning: () => "Aucun planning",
  jour_repos: () => "Jour de repos",
  hors_fenetre: () => "Hors fenêtre de pointage",
  a_l_heure: () => "À l'heure",
  retard: (ecart) => `En retard de ${ecart}`,
  depart_anticipe: (ecart) => `Départ anticipé de ${ecart}`,
  heures_sup: (ecart) => `Heures sup. : ${ecart}`,
  pause_non_prevue: () => "Pas de pause prévue",
  pause_anticipee: (ecart) => `Pause commencée ${ecart} trop tôt`,
  retour_pause_retard: (ecart) => `Retour de pause en retard de ${ecart}`,
  conforme: () => "Conforme au planning",
  heures_sup_non_prevues: () => "Heures sup. non prévues",
  avant_fin_service: (ecart) => `${ecart} avant la fin du service`,
};

/** Courts, pour résumer plusieurs pointages (« 2 à l'heure, 1 en retard »). */
const LIBELLES_COURTS: Record<CodeStatut, string> = {
  aucun_planning: "sans planning",
  jour_repos: "en jour de repos",
  hors_fenetre: "hors fenêtre",
  a_l_heure: "à l'heure",
  retard: "en retard",
  depart_anticipe: "en départ anticipé",
  heures_sup: "en heures sup.",
  pause_non_prevue: "sans pause prévue",
  pause_anticipee: "en pause anticipée",
  retour_pause_retard: "en retour de pause tardif",
  conforme: "conformes",
  heures_sup_non_prevues: "en heures sup. non prévues",
  avant_fin_service: "avant la fin du service",
};

export const TEXTES_STATUT_POINTAGE = {
  colonne: "Résultat",
  aideColonne: "Comparaison avec le planning de l'employé (affectation, rotation, calendrier).",
  explications: {
    aucun_planning: "Aucune affectation ne couvre ce jour (ni pour l'employé, ni pour son groupe).",
    jour_repos: "La rotation prévoit un repos ce jour-là.",
    hors_fenetre: "Le pointage tombe en dehors des fenêtres d'entrée et de sortie du calendrier.",
  } as Partial<Record<CodeStatut, string>>,
};

export function libelleStatut(statut: StatutPointage): string {
  return LIBELLES[statut.code](formaterEcart(statut.minutes ?? 0));
}

/** Calendrier de référence : « Bureau · 08:00 – 17:00 ». */
export function libelleService(statut: StatutPointage): string | null {
  const calendrier = statut.calendrier;
  if (!calendrier) return null;
  return `${calendrier.nom} · ${minutesVersHeure(calendrier.debutMinutes)} – ${minutesVersHeure(calendrier.finMinutes)}`;
}

/** Résumé de plusieurs statuts, dans l'ordre d'apparition : « 2 à l'heure, 1 en retard ». */
export function resumerStatuts(statuts: StatutPointage[]): string {
  const nombres = new Map<CodeStatut, number>();
  for (const statut of statuts) nombres.set(statut.code, (nombres.get(statut.code) ?? 0) + 1);
  return [...nombres].map(([code, nombre]) => `${nombre} ${LIBELLES_COURTS[code]}`).join(", ");
}
