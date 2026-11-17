/**
 * Planning d'un employé pour un jour. S'il a l'horaire dynamique et qu'une règle reconnaît son
 * premier pointage, c'est le profil de cette règle. Sinon : affectation (la sienne avant celle
 * de son groupe), puis rotation, puis profil horaire du jour ou repos. Fonctions pures.
 */
import type { ProfilHoraire, Rotation } from "../../types/index.ts";
import { clePremierPointage, regleReconnue, type RegleHoraire } from "./horaire-dynamique.ts";
import { numeroJourRotation } from "./programme.ts";

export type AffectationPlanning = {
  rotationId: string;
  groupeId: string | null;
  employeId: string | null;
  dateDebut: string;
  dateFin: string | null;
};

/** Horaire dynamique : règles, et premier pointage (minute locale) des seuls employés qui l'ont activé. */
export type DonneesHoraireDynamique = {
  regles: RegleHoraire[];
  /** Clé `clePremierPointage(employeId, jour)`. */
  premiersPointages: Map<string, number>;
};

/** Tout ce qu'il faut pour connaître le planning des employés concernés. */
export type DonneesPlanning = {
  affectations: AffectationPlanning[];
  rotations: Map<string, Rotation>;
  profils: Map<string, ProfilHoraire>;
  horaireDynamique?: DonneesHoraireDynamique;
};

export type PlanningDuJour =
  | { type: "aucun" }
  | { type: "repos"; rotation: Rotation; profil: ProfilHoraire | null }
  /** `rotation` vaut null quand le profil vient de l'horaire dynamique. */
  | { type: "travail"; rotation: Rotation | null; profil: ProfilHoraire };

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

/** Profil reconnu par l'horaire dynamique pour cet employé ce jour-là, ou null. */
export function profilDynamique(employeId: string, jour: string, donnees: DonneesPlanning): ProfilHoraire | null {
  const dynamique = donnees.horaireDynamique;
  const premier = dynamique?.premiersPointages.get(clePremierPointage(employeId, jour));
  if (!dynamique || premier === undefined) return null;
  const regle = regleReconnue(dynamique.regles, jour, premier);
  const profil = regle ? donnees.profils.get(regle.profilId) : undefined;
  return profil?.type === "travail" ? profil : null;
}

/** Ce que prévoit le planning de l'employé pour ce jour : travail (profil), repos, ou rien. */
export function planningDuJour(employe: { id: string; groupeId: string | null }, jour: string, donnees: DonneesPlanning): PlanningDuJour {
  const dynamique = profilDynamique(employe.id, jour, donnees);
  if (dynamique) return { type: "travail", rotation: null, profil: dynamique };

  const affectation = affectationDuJour(employe, jour, donnees.affectations);
  const rotation = affectation ? donnees.rotations.get(affectation.rotationId) : undefined;
  if (!affectation || !rotation) return { type: "aucun" };

  const numero = numeroJourRotation(rotation, affectation.dateDebut, jour);
  const profilId = numero === null ? undefined : rotation.jours[numero];
  const profil = profilId ? donnees.profils.get(profilId) : undefined;
  if (profil?.type === "travail") return { type: "travail", rotation, profil };
  return { type: "repos", rotation, profil: profil ?? null };
}
