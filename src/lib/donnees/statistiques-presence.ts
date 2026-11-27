import "server-only";

import { and, asc, eq, gte, lt, type SQL } from "drizzle-orm";
import { FUSEAU_HORAIRE, STATISTIQUES_EMPLOYES_MAX, UN_JOUR_MILLISECONDES } from "@/lib/constantes";
import { ajouterJours, joursEntre } from "@/lib/metier/compteurs/periodes";
import { horaireDuProfil } from "@/lib/metier/compteurs/variables";
import { jourEtMinuteLocaux } from "@/lib/metier/dates";
import { planningDuJour } from "@/lib/metier/planning-jour";
import type { EmployeStatistiques, EvenementEnJournees, Maintenant } from "@/lib/metier/statistiques-presence";
import { evenementsEnJourneesDeLaPeriode } from "./absences";
import { obtenirBase } from "./base";
import { chargerHoraireDynamique } from "./horaire-dynamique";
import { chargerPlanning } from "./planning";
import { departements, employes, pointages } from "./schema";

export type DonneesStatistiques = { employes: EmployeStatistiques[]; jours: string[]; maintenant: Maintenant; estTronque: boolean };

/** Employé de l'équipe, avec ce qu'il faut pour l'afficher dans un état (matricule, nom). */
export type EmployeEquipe = EmployeStatistiques & { matricule: string; nomComplet: string };

/** Tous les pointages de la période (un jour de marge de chaque côté pour le fuseau), en heure de Casablanca. */
async function pointagesDeLaPeriode(debut: string, fin: string) {
  const lignes = await obtenirBase()
    .select({ employeId: pointages.employeId, horodatage: pointages.horodatage })
    .from(pointages)
    .where(
      and(
        gte(pointages.horodatage, new Date(Date.parse(`${debut}T00:00:00Z`) - UN_JOUR_MILLISECONDES)),
        lt(pointages.horodatage, new Date(Date.parse(`${fin}T00:00:00Z`) + 2 * UN_JOUR_MILLISECONDES)),
      ),
    )
    .orderBy(asc(pointages.horodatage));
  return lignes.map((ligne) => ({ ...ligne, ...jourEtMinuteLocaux(ligne.horodatage, FUSEAU_HORAIRE) }));
}

/** Regroupe des éléments par employé. */
function parEmploye<T extends { employeId: string }>(elements: readonly T[]): Map<string, T[]> {
  const groupes = new Map<string, T[]>();
  for (const element of elements) {
    const siens = groupes.get(element.employeId);
    if (siens) siens.push(element);
    else groupes.set(element.employeId, [element]);
  }
  return groupes;
}

/**
 * Journées de service de l'équipe (STATISTIQUES_EMPLOYES_MAX employés au plus, ceux qui
 * répondent à `filtre`) du `debut` au `fin` : horaire prévu (horaire dynamique, sinon rotation),
 * pointages et événements en journées entières. Cinq lectures en tout. Sert aux statistiques du
 * tableau de bord et aux états.
 */
export async function chargerJourneesEquipe(debut: string, fin: string, filtre?: SQL): Promise<{ employes: EmployeEquipe[]; estTronque: boolean }> {
  const jours = joursEntre(debut, fin);
  const [lignesEmployes, locaux, evenementsPeriode] = await Promise.all([
    obtenirBase()
      .select({
        id: employes.id,
        matricule: employes.matricule,
        prenom: employes.prenom,
        nom: employes.nom,
        groupeId: employes.groupeId,
        departement: departements.nom,
        dateEmbauche: employes.dateEmbauche,
        dateDebutEmploi: employes.dateDebutEmploi,
        dateFinEmploi: employes.dateFinEmploi,
      })
      .from(employes)
      .innerJoin(departements, eq(departements.id, employes.departementId))
      .where(filtre)
      .orderBy(asc(employes.nom), asc(employes.prenom), asc(employes.id))
      .limit(STATISTIQUES_EMPLOYES_MAX + 1),
    pointagesDeLaPeriode(debut, fin),
    evenementsEnJourneesDeLaPeriode(debut, fin),
  ]);
  const estTronque = lignesEmployes.length > STATISTIQUES_EMPLOYES_MAX;
  const equipe = lignesEmployes.slice(0, STATISTIQUES_EMPLOYES_MAX);
  const [planning, horaireDynamique] = await Promise.all([
    chargerPlanning(equipe),
    chargerHoraireDynamique(locaux.map(({ employeId, horodatage }) => ({ employeId, horodatage }))),
  ]);
  const donnees = { ...planning, horaireDynamique };
  const pointagesParEmploye = parEmploye(locaux);
  const evenementsParEmploye = parEmploye(evenementsPeriode);

  return {
    estTronque,
    employes: equipe.map((employe) => {
      const siens = pointagesParEmploye.get(employe.id) ?? [];
      const evenements: EvenementEnJournees[] = (evenementsParEmploye.get(employe.id) ?? []).map(({ id, debut: du, fin: au, code, nom, type, priorite, neutralisePointage }) => ({
        id,
        debut: du,
        fin: au,
        code,
        nom,
        type,
        priorite,
        neutralisePointage,
      }));
      return {
        id: employe.id,
        matricule: employe.matricule,
        nomComplet: `${employe.prenom} ${employe.nom}`,
        departement: employe.departement,
        debutEmploi: employe.dateDebutEmploi ?? employe.dateEmbauche,
        finEmploi: employe.dateFinEmploi,
        evenements,
        jours: jours.map((jour) => {
          const prevu = planningDuJour(employe, jour, donnees);
          return {
            jour,
            horaire: prevu.type === "travail" ? horaireDuProfil(prevu.profil) : null,
            profil: prevu.type === "travail" ? { code: prevu.profil.code, nom: prevu.profil.nom, estDynamique: prevu.rotation === null } : null,
            estSansPlanning: prevu.type === "aucun",
            pointages: siens.filter((pointage) => pointage.jour === jour).map((pointage) => pointage.minutes),
          };
        }),
      };
    }),
  };
}

/** Statistiques du tableau de bord : toute l'équipe sur les `nombreJours` derniers jours (aujourd'hui compris). */
export async function chargerStatistiques(nombreJours: number, maintenantInstant: Date): Promise<DonneesStatistiques> {
  const maintenant = jourEtMinuteLocaux(maintenantInstant, FUSEAU_HORAIRE);
  const debut = ajouterJours(maintenant.jour, -(nombreJours - 1));
  const { employes: equipe, estTronque } = await chargerJourneesEquipe(debut, maintenant.jour);
  return { maintenant: { jour: maintenant.jour, minute: maintenant.minutes }, jours: joursEntre(debut, maintenant.jour), estTronque, employes: equipe };
}
