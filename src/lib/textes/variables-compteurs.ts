/** Libellé et règle de calcul de chaque variable des compteurs (aide de l'éditeur de formules). */
import type { VARIABLES_COMPTEURS } from "../metier/compteurs/variables.ts";

type NomVariable = (typeof VARIABLES_COMPTEURS)[number]["nom"];

export const TEXTES_VARIABLES: Record<NomVariable, { libelle: string; regle: string }> = {
  DUREE_PREVUE_MIN: { libelle: "Durée prévue", regle: "Somme des plages fixes du profil horaire du jour. Inconnue sans horaire." },
  DUREE_TRAVAILLEE_MIN: {
    libelle: "Durée travaillée",
    regle: "Du premier au dernier pointage du jour (2 pointages au moins). Inconnue s'il manque la sortie.",
  },
  RETARD_MIN: { libelle: "Retard", regle: "Premier pointage après le début de la première plage fixe : l'écart, sinon 0." },
  AVANCE_MIN: { libelle: "Avance", regle: "Premier pointage avant le début de la première plage fixe : l'écart, sinon 0." },
  DEPART_ANTICIPE_MIN: { libelle: "Départ anticipé", regle: "Dernier pointage avant la fin de la dernière plage fixe : l'écart, sinon 0." },
  DEPASSEMENT_MIN: { libelle: "Dépassement", regle: "Dernier pointage après la fin de la dernière plage fixe : l'écart, sinon 0." },
  NB_POINTAGES: { libelle: "Nombre de pointages", regle: "Pointages de la journée (tous états confondus)." },
  DUREE_NUIT_MIN: { libelle: "Durée de nuit", regle: "Présence (de l'entrée à la sortie) avant 6 h ou après 21 h. Inconnue s'il manque la sortie." },
  DUREE_ABSENCE_MIN: {
    libelle: "Durée d'absence",
    regle: "Événement d'absence retenu en journée entière (durée prévue du jour) plus les absences saisies en heures.",
  },
  DUREE_EVT_PRESENCE_MIN: {
    libelle: "Durée d'événement de présence",
    regle: "Événement de présence (mission, formation) retenu en journée entière (durée prévue du jour) plus ceux saisis en heures.",
  },
  JOURS_ABSENCE: { libelle: "Jour d'absence justifiée", regle: "1 si un événement d'absence est retenu en journée entière, sinon 0." },
  A_HORAIRE: { libelle: "A un horaire", regle: "1 si un profil de travail est prévu ce jour-là (horaire dynamique ou rotation), sinon 0." },
  PRESENT: { libelle: "Présent", regle: "1 s'il y a au moins un pointage (ou un profil non badgé), sinon 0." },
  NB_JOURS: { libelle: "Jours écoulés", regle: "Jours de la période jusqu'à aujourd'hui." },
  NB_JOURS_PLANIFIES: { libelle: "Jours planifiés", regle: "Jours avec un horaire de travail." },
  NB_JOURS_TRAVAILLES: { libelle: "Jours travaillés", regle: "Jours où l'employé est présent." },
  NB_ABSENCES: { libelle: "Absences", regle: "Jours planifiés sans aucun pointage (aujourd'hui compris)." },
  NB_JOURS_INCOMPLETS: { libelle: "Jours incomplets", regle: "Jours de présence sans sortie (un seul pointage)." },
};

/** Variables propres à chaque événement (code en majuscules). */
export const TEXTES_VARIABLES_CODES = {
  titre: "Par événement",
  aucun: "Aucun événement pour l'instant (Présence > Gestion des exceptions > Événements).",
  jours: (nom: string) => ({ libelle: `Jours de ${nom}`, regle: "1 si cet événement est retenu en journée entière, sinon 0 (additionné sur la semaine et le mois)." }),
  minutes: (nom: string) => ({ libelle: `Durée de ${nom}`, regle: "Journée entière retenue (durée prévue du jour) plus les saisies en heures, en minutes." }),
  pris: (nom: string) => ({ libelle: `${nom} : pris`, regle: "Droit aux congés qui couvre la fin de la période : consommé jusqu'à aujourd'hui, dans l'unité du droit. Inconnu sans droit." }),
  solde: (nom: string) => ({ libelle: `${nom} : solde`, regle: "Droit utilisable moins pris, dans l'unité du droit. Inconnu sans droit." }),
};

export const TEXTES_PERIODICITES = { JOUR: "Jour", SEMAINE: "Semaine", MOIS: "Mois" } as const;
export const TEXTES_AGREGATION = "Semaine et mois : somme des seuls jours connus ; si aucun jour n'est connu, la valeur reste inconnue (jamais 0).";
