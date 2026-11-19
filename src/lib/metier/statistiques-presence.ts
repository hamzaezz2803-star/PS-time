/**
 * Statistiques de présence du tableau de bord, calculées sur les vrais pointages et le planning
 * (mêmes règles que les compteurs : lib/metier/compteurs/variables.ts). Rien n'est stocké.
 * Fonctions pures, testées dans statistiques-presence.test.ts.
 */
import { variablesDuJour, type JourService } from "./compteurs/variables.ts";

/** Situation d'un employé un jour donné. « justifie » : absent avec un événement d'absence (congé, maladie...). */
export type StatutJour = "a_l_heure" | "en_retard" | "absent" | "justifie" | "attendu" | "sans_horaire";

/** Événement en journées entières attribué à l'employé (Absences et événements), bornes comprises. */
export type EvenementEnJournees = { debut: string; fin: string; type: "absence" | "presence" };

export type EmployeStatistiques = {
  id: string;
  departement: string;
  /** Période d'emploi (AAAA-MM-JJ) : en dehors, l'employé ne compte pas ce jour-là. */
  debutEmploi: string | null;
  finEmploi: string | null;
  jours: JourService[];
  /** Événements en journées entières (les saisies en heures ne changent pas le statut du jour). */
  evenements?: readonly EvenementEnJournees[];
};

export type Maintenant = { jour: string; minute: number };

export const estEnPoste = (employe: Pick<EmployeStatistiques, "debutEmploi" | "finEmploi">, jour: string) =>
  (employe.debutEmploi === null || employe.debutEmploi <= jour) && (employe.finEmploi === null || jour <= employe.finEmploi);

/** Type de l'événement qui couvre ce jour en entier, ou null (deux saisies d'un employé ne se chevauchent jamais). */
export function evenementDuJour(employe: Pick<EmployeStatistiques, "evenements">, jour: string): EvenementEnJournees["type"] | null {
  return employe.evenements?.find((evenement) => evenement.debut <= jour && jour <= evenement.fin)?.type ?? null;
}

/**
 * Statut d'une journée : présent à l'heure ou en retard (retard d'au moins une minute), absent,
 * « attendu » (aujourd'hui, l'heure prévue d'arrivée n'est pas encore passée), ou sans horaire
 * (repos, aucun planning). Sans pointage, un événement change le statut : présence (formation,
 * mission) = présent, absence (congé, maladie) = absence justifiée. Les pointages passent avant.
 */
export function statutDuJour(jour: JourService, maintenant: Maintenant, evenement: EvenementEnJournees["type"] | null = null): StatutJour {
  if (!jour.horaire) return "sans_horaire";
  const valeurs = variablesDuJour(jour);
  if (valeurs.PRESENT === 1) return (valeurs.RETARD_MIN ?? 0) > 0 ? "en_retard" : "a_l_heure";
  if (evenement === "presence") return "a_l_heure";
  if (evenement === "absence") return "justifie";
  return jour.jour === maintenant.jour && maintenant.minute < jour.horaire.debutPrevu ? "attendu" : "absent";
}

export type BilanJour = {
  jour: string;
  effectif: number;
  prevus: number;
  aLHeure: number;
  enRetard: number;
  absents: number;
  justifies: number;
  attendus: number;
  minutesPrevues: number;
  minutesTravaillees: number;
  minutesRetard: number;
  minutesSupplementaires: number;
};

const somme = (valeurs: readonly (number | null | undefined)[]) => valeurs.reduce<number>((total, valeur) => total + (valeur ?? 0), 0);

/** Bilan d'un jour pour toute l'équipe (employés en poste ce jour-là). */
export function bilanDuJour(employes: readonly EmployeStatistiques[], jour: string, maintenant: Maintenant): BilanJour {
  const enPoste = employes.filter((employe) => estEnPoste(employe, jour));
  const journees = enPoste.flatMap((employe) => employe.jours.filter((j) => j.jour === jour));
  const statuts = enPoste.flatMap((employe) =>
    employe.jours.filter((j) => j.jour === jour).map((journee) => statutDuJour(journee, maintenant, evenementDuJour(employe, jour))),
  );
  const valeurs = journees.map(variablesDuJour);
  const compter = (statut: StatutJour) => statuts.filter((s) => s === statut).length;
  return {
    jour,
    effectif: journees.length,
    prevus: statuts.filter((statut) => statut !== "sans_horaire").length,
    aLHeure: compter("a_l_heure"),
    enRetard: compter("en_retard"),
    absents: compter("absent"),
    justifies: compter("justifie"),
    attendus: compter("attendu"),
    minutesPrevues: somme(valeurs.map((v) => v.DUREE_PREVUE_MIN)),
    minutesTravaillees: somme(valeurs.map((v) => v.DUREE_TRAVAILLEE_MIN)),
    minutesRetard: somme(valeurs.map((v) => v.RETARD_MIN)),
    minutesSupplementaires: somme(valeurs.map((v) => v.DEPASSEMENT_MIN)),
  };
}

/** Taux de présence en % (présents / attendus déjà échus, absences justifiées exclues), ou null si personne n'était attendu. */
export function tauxPresence(bilan: Pick<BilanJour, "aLHeure" | "enRetard" | "absents">): number | null {
  const echus = bilan.aLHeure + bilan.enRetard + bilan.absents;
  return echus === 0 ? null : Math.round(((bilan.aLHeure + bilan.enRetard) / echus) * 1000) / 10;
}

/** Cumul d'une période : additionne les bilans de ses jours. */
export function cumulerBilans(bilans: readonly BilanJour[]): Omit<BilanJour, "jour" | "effectif"> {
  const cles = ["prevus", "aLHeure", "enRetard", "absents", "justifies", "attendus", "minutesPrevues", "minutesTravaillees", "minutesRetard", "minutesSupplementaires"] as const;
  return Object.fromEntries(cles.map((cle) => [cle, somme(bilans.map((bilan) => bilan[cle]))])) as Omit<BilanJour, "jour" | "effectif">;
}

export type PresenceDepartement = { departement: string; prevus: number; presents: number; taux: number | null };

/** Présence du jour par département (attendus déjà échus seulement), du plus grand effectif prévu au plus petit. */
export function presenceParDepartement(employes: readonly EmployeStatistiques[], maintenant: Maintenant): PresenceDepartement[] {
  const parDepartement = new Map<string, { aLHeure: number; enRetard: number; absents: number }>();
  for (const employe of employes) {
    const journee = employe.jours.find((j) => j.jour === maintenant.jour);
    if (!journee || !estEnPoste(employe, maintenant.jour)) continue;
    const statut = statutDuJour(journee, maintenant, evenementDuJour(employe, maintenant.jour));
    if (statut === "sans_horaire" || statut === "attendu" || statut === "justifie") continue;
    const compte = parDepartement.get(employe.departement) ?? { aLHeure: 0, enRetard: 0, absents: 0 };
    if (statut === "a_l_heure") compte.aLHeure += 1;
    else if (statut === "en_retard") compte.enRetard += 1;
    else compte.absents += 1;
    parDepartement.set(employe.departement, compte);
  }
  return [...parDepartement.entries()]
    .map(([departement, compte]) => ({
      departement,
      prevus: compte.aLHeure + compte.enRetard + compte.absents,
      presents: compte.aLHeure + compte.enRetard,
      taux: tauxPresence(compte),
    }))
    .sort((a, b) => b.prevus - a.prevus || a.departement.localeCompare(b.departement, "fr"));
}

/** Arrivées du jour par heure (heure du premier pointage), de la première à la dernière heure utilisée. */
export function arriveesParHeure(employes: readonly EmployeStatistiques[], jour: string): { heure: number; arrivees: number }[] {
  const heures = employes.flatMap((employe) => {
    const journee = employe.jours.find((j) => j.jour === jour);
    const premier = journee && journee.pointages.length > 0 ? Math.min(...journee.pointages) : null;
    return premier === null ? [] : [Math.floor(premier / 60)];
  });
  if (heures.length === 0) return [];
  const [min, max] = [Math.min(...heures), Math.max(...heures)];
  return Array.from({ length: max - min + 1 }, (_, rang) => ({ heure: min + rang, arrivees: heures.filter((heure) => heure === min + rang).length }));
}
