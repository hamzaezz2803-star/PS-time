import "server-only";

import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { PLANNING_JOURS_MAX } from "@/lib/constantes";
import { joursEntre } from "@/lib/metier/compteurs/periodes";
import { jourDePlanning, type JourPlanning, type PeriodeEmploi } from "@/lib/metier/planning-consultation";
import { evenementsEnJourneesDeLEmploye } from "./absences";
import { obtenirBase } from "./base";
import { aujourdhuiLocal, chargerJoursService } from "./compteurs-calcul";
import { departements, employes, evenementsEmployes } from "./schema";

export type EmployePlanning = { id: string; nomComplet: string; matricule: string; departement: string };

export type ResultatPlanning = { ok: true; employe: EmployePlanning; jours: JourPlanning[] } | { ok: false; erreur: "employe" | "dates" };

async function lireEmploye(employeId: string): Promise<(EmployePlanning & PeriodeEmploi) | null> {
  const [ligne] = await obtenirBase()
    .select({
      id: employes.id,
      prenom: employes.prenom,
      nom: employes.nom,
      matricule: employes.matricule,
      departement: departements.nom,
      dateEmbauche: employes.dateEmbauche,
      dateDebutEmploi: employes.dateDebutEmploi,
      dateFinEmploi: employes.dateFinEmploi,
    })
    .from(employes)
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .where(eq(employes.id, employeId))
    .limit(1);
  if (!ligne) return null;
  return {
    id: ligne.id,
    nomComplet: `${ligne.prenom} ${ligne.nom}`,
    matricule: ligne.matricule,
    departement: ligne.departement,
    debutEmploi: ligne.dateDebutEmploi ?? ligne.dateEmbauche,
    finEmploi: ligne.dateFinEmploi,
  };
}

/** Jours de la période touchés par un événement saisi en heures (un seul jour par saisie). */
async function joursAvecEvenementEnHeures(employeId: string, debut: string, fin: string): Promise<Set<string>> {
  const lignes = await obtenirBase()
    .select({ jour: evenementsEmployes.dateDebut })
    .from(evenementsEmployes)
    .where(and(eq(evenementsEmployes.employeId, employeId), isNotNull(evenementsEmployes.debutMinutes), gte(evenementsEmployes.dateDebut, debut), lte(evenementsEmployes.dateDebut, fin)));
  return new Set(lignes.map((ligne) => ligne.jour));
}

/**
 * Planning d'un employé de `debut` à `fin` (une année au plus) : chaque jour avec son horaire
 * prévu, l'événement retenu, ses pointages et ses anomalies. Calculé à l'affichage, jamais stocké.
 */
export async function chargerPlanningEmploye(employeId: string, debut: string, fin: string): Promise<ResultatPlanning> {
  if (joursEntre(debut, fin).length > PLANNING_JOURS_MAX) return { ok: false, erreur: "dates" };
  const employe = await lireEmploye(employeId);
  if (!employe) return { ok: false, erreur: "employe" };

  const [chargement, evenements, enHeures] = await Promise.all([
    chargerJoursService(employeId, debut, fin, PLANNING_JOURS_MAX),
    evenementsEnJourneesDeLEmploye(employeId, debut, fin),
    joursAvecEvenementEnHeures(employeId, debut, fin),
  ]);
  if (!chargement.ok) return { ok: false, erreur: chargement.erreur };

  const aujourdhui = aujourdhuiLocal();
  const { debutEmploi, finEmploi, ...identite } = employe;
  const jours = chargement.jours.map((journee) => jourDePlanning(journee, evenements, enHeures, aujourdhui, { debutEmploi, finEmploi }));
  return { ok: true, employe: identite, jours };
}
