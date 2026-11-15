/**
 * Planning d'un employé pour un jour : affectation (la sienne avant celle de son groupe),
 * puis rotation, puis calendrier du jour ou repos. Fonctions pures, testées dans planning-jour.test.ts.
 */
import type { Calendrier, Rotation } from "../../types/index.ts";
import { numeroJourRotation } from "./programme.ts";

export type AffectationPlanning = {
  rotationId: string;
  groupeId: string | null;
  employeId: string | null;
  dateDebut: string;
  dateFin: string | null;
};

/** Tout ce qu'il faut pour connaître le planning des employés concernés. */
export type DonneesPlanning = {
  affectations: AffectationPlanning[];
  rotations: Map<string, Rotation>;
  calendriers: Map<string, Calendrier>;
};

export type PlanningDuJour =
  | { type: "aucun" }
  | { type: "repos"; rotation: Rotation }
  | { type: "travail"; rotation: Rotation; calendrier: Calendrier };

const couvre = (affectation: AffectationPlanning, jour: string) =>
  affectation.dateDebut <= jour && (affectation.dateFin === null || jour <= affectation.dateFin);

/** Affectation qui s'applique ce jour-là : celle de l'employé passe avant celle de son groupe. */
export function affectationDuJour(
  employe: { id: string; groupeId: string | null },
  jour: string,
  affectations: AffectationPlanning[],
): AffectationPlanning | null {
  const individuelle = affectations.find((a) => a.employeId === employe.id && couvre(a, jour));
  if (individuelle) return individuelle;
  if (!employe.groupeId) return null;
  return affectations.find((a) => a.groupeId === employe.groupeId && couvre(a, jour)) ?? null;
}

/** Ce que prévoit le planning de l'employé pour ce jour (travail avec son calendrier, repos, ou rien). */
export function planningDuJour(employe: { id: string; groupeId: string | null }, jour: string, donnees: DonneesPlanning): PlanningDuJour {
  const affectation = affectationDuJour(employe, jour, donnees.affectations);
  const rotation = affectation ? donnees.rotations.get(affectation.rotationId) : undefined;
  if (!affectation || !rotation) return { type: "aucun" };

  const numero = numeroJourRotation(rotation, affectation.dateDebut, jour);
  const calendrierId = numero === null ? undefined : rotation.jours[numero];
  const calendrier = calendrierId ? donnees.calendriers.get(calendrierId) : undefined;
  return calendrier ? { type: "travail", rotation, calendrier } : { type: "repos", rotation };
}
