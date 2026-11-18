/** Textes du tableau de bord : statistiques de présence (aperçu). */
export const TEXTES_PRESENCE = {
  statistiques: {
    titre: "Statistiques de présence",
    apercu: "Aperçu de démonstration",
    aideApercu: "Ces chiffres sont des exemples pour présenter l'écran. Ils seront calculés à partir des vrais pointages quand les badgeuses seront reliées.",
    presents: "Présents aujourd'hui",
    surEffectif: (presents: number, effectif: number) => `${presents} sur ${effectif}`,
    retards: "Retards",
    absents: "Absents",
    heuresSup: "Heures sup. (semaine)",
    tauxSemaine: "Taux de présence, 7 derniers jours",
    repartition: "Répartition du jour",
    statuts: { a_l_heure: "À l'heure", retard: "En retard", absent: "Absent" },
    tableau: { jour: "Jour", taux: "Taux de présence" },
  },
} as const;
