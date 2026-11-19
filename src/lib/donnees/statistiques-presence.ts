import "server-only";

import { and, asc, eq, gte, lt } from "drizzle-orm";
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

/**
 * Journées de service de toute l'équipe sur les `nombreJours` derniers jours (aujourd'hui compris) :
 * horaire prévu (horaire dynamique, sinon rotation), pointages et événements en journées entières.
 * Cinq lectures en tout.
 */
export async function chargerStatistiques(nombreJours: number, maintenantInstant: Date): Promise<DonneesStatistiques> {
  const maintenant = jourEtMinuteLocaux(maintenantInstant, FUSEAU_HORAIRE);
  const maintenantJour = { jour: maintenant.jour, minute: maintenant.minutes };
  const debut = ajouterJours(maintenant.jour, -(nombreJours - 1));
  const jours = joursEntre(debut, maintenant.jour);

  const [lignesEmployes, locaux, evenementsPeriode] = await Promise.all([
    obtenirBase()
      .select({
        id: employes.id,
        groupeId: employes.groupeId,
        departement: departements.nom,
        dateEmbauche: employes.dateEmbauche,
        dateDebutEmploi: employes.dateDebutEmploi,
        dateFinEmploi: employes.dateFinEmploi,
      })
      .from(employes)
      .innerJoin(departements, eq(departements.id, employes.departementId))
      .orderBy(asc(employes.id))
      .limit(STATISTIQUES_EMPLOYES_MAX + 1),
    pointagesDeLaPeriode(debut, maintenant.jour),
    evenementsEnJourneesDeLaPeriode(debut, maintenant.jour),
  ]);
  const evenementsParEmploye = new Map<string, EvenementEnJournees[]>();
  for (const { employeId, debut: du, fin: au, type } of evenementsPeriode) {
    evenementsParEmploye.set(employeId, [...(evenementsParEmploye.get(employeId) ?? []), { debut: du, fin: au, type }]);
  }
  const estTronque = lignesEmployes.length > STATISTIQUES_EMPLOYES_MAX;
  const equipe = lignesEmployes.slice(0, STATISTIQUES_EMPLOYES_MAX);
  const [planning, horaireDynamique] = await Promise.all([
    chargerPlanning(equipe),
    chargerHoraireDynamique(locaux.map(({ employeId, horodatage }) => ({ employeId, horodatage }))),
  ]);
  const donnees = { ...planning, horaireDynamique };

  const pointagesParEmploye = new Map<string, typeof locaux>();
  for (const pointage of locaux) {
    const siens = pointagesParEmploye.get(pointage.employeId);
    if (siens) siens.push(pointage);
    else pointagesParEmploye.set(pointage.employeId, [pointage]);
  }

  return {
    maintenant: maintenantJour,
    jours,
    estTronque,
    employes: equipe.map((employe) => {
      const siens = pointagesParEmploye.get(employe.id) ?? [];
      return {
        id: employe.id,
        departement: employe.departement,
        debutEmploi: employe.dateDebutEmploi ?? employe.dateEmbauche,
        finEmploi: employe.dateFinEmploi,
        evenements: evenementsParEmploye.get(employe.id) ?? [],
        jours: jours.map((jour) => {
          const prevu = planningDuJour(employe, jour, donnees);
          return {
            jour,
            horaire: prevu.type === "travail" ? horaireDuProfil(prevu.profil) : null,
            pointages: siens.filter((pointage) => pointage.jour === jour).map((pointage) => pointage.minutes),
          };
        }),
      };
    }),
  };
}
