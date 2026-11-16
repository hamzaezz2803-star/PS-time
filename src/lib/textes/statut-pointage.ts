/** Libellés des résultats de pointage (comparaison avec le profil horaire du jour). */
import { formaterEcart, minutesVersHeure } from "@/lib/metier/programme";
import type { CodeStatut, StatutPointage } from "@/lib/metier/statut-pointage";

const LIBELLES: Record<CodeStatut, (ecart: string) => string> = {
  aucun_planning: () => "Aucun planning",
  jour_repos: () => "Jour de repos",
  non_badge: () => "Profil non badgé",
  plage_interdite: () => "Plage interdite",
  plage_neutralisee: () => "Hors limite (plage neutralisée)",
  a_l_heure: () => "À l'heure",
  retard_tolere: (ecart) => `Retard toléré (${ecart})`,
  retard: (ecart) => `En retard de ${ecart}`,
  depart_anticipe: (ecart) => `Départ anticipé de ${ecart}`,
  pause_non_prevue: () => "Pas de repas prévu",
  pause_anticipee: (ecart) => `Repas commencé ${ecart} trop tôt`,
  retour_pause_retard: (ecart) => `Retour de repas en retard de ${ecart}`,
  conforme: () => "Conforme au profil",
};

/** Courts, pour résumer plusieurs pointages (« 2 à l'heure, 1 en retard »). */
const LIBELLES_COURTS: Record<CodeStatut, string> = {
  aucun_planning: "sans planning",
  jour_repos: "en jour de repos",
  non_badge: "sur un profil non badgé",
  plage_interdite: "en plage interdite",
  plage_neutralisee: "hors limite",
  a_l_heure: "à l'heure",
  retard_tolere: "en retard toléré",
  retard: "en retard",
  depart_anticipe: "en départ anticipé",
  pause_non_prevue: "sans repas prévu",
  pause_anticipee: "en repas anticipé",
  retour_pause_retard: "en retour de repas tardif",
  conforme: "conformes",
};

export const TEXTES_STATUT_POINTAGE = {
  colonne: "Résultat",
  aideColonne: "Comparaison avec le profil horaire du jour (affectation, rotation, profil) et heure validée.",
  explications: {
    aucun_planning: "Aucune affectation ne couvre ce jour (ni pour l'employé, ni pour son groupe).",
    jour_repos: "La rotation prévoit un repos ce jour-là.",
    non_badge: "L'employé est considéré présent toute la journée : son pointage n'est pas compté.",
    plage_interdite: "Aucun pointage ne doit avoir lieu dans cette plage du profil horaire.",
    plage_neutralisee: "L'employé n'est pas attendu dans cette plage du profil horaire.",
  } as Partial<Record<CodeStatut, string>>,
};

export function libelleStatut(statut: StatutPointage): string {
  return LIBELLES[statut.code](formaterEcart(statut.minutes ?? 0));
}

/** Profil de référence et heure validée : « J8 · Journée de 8 h · validé 08:00 ». */
export function libelleService(statut: StatutPointage): string | null {
  const profil = statut.profil;
  if (!profil) return null;
  const valide = statut.pointValide === undefined ? [] : [`validé ${minutesVersHeure(statut.pointValide)}`];
  return [profil.code, profil.nom, ...valide].join(" · ");
}

/** Résumé de plusieurs statuts, dans l'ordre d'apparition : « 2 à l'heure, 1 en retard ». */
export function resumerStatuts(statuts: StatutPointage[]): string {
  const nombres = new Map<CodeStatut, number>();
  for (const statut of statuts) nombres.set(statut.code, (nombres.get(statut.code) ?? 0) + 1);
  return [...nombres].map(([code, nombre]) => `${nombre} ${LIBELLES_COURTS[code]}`).join(", ");
}
