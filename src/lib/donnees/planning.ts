import "server-only";

import { inArray, or } from "drizzle-orm";
import { ETATS_POINTAGE, FUSEAU_HORAIRE } from "@/lib/constantes";
import type { DonneesPlanning } from "@/lib/metier/planning-jour";
import { statutPointage, type EtatPointageEvalue, type StatutPointage } from "@/lib/metier/statut-pointage";
import { obtenirBase } from "./base";
import { listerProfils } from "./profils-horaires";
import { listerRotations } from "./rotations";
import { affectations, employes } from "./schema";

/**
 * Planning des employés donnés : leurs affectations et celles de leurs groupes, avec toutes
 * les rotations et tous les profils horaires (peu nombreux). Sert à évaluer leurs pointages.
 */
export async function chargerPlanning(employesConcernes: { id: string; groupeId: string | null }[]): Promise<DonneesPlanning> {
  const employeIds = [...new Set(employesConcernes.map((employe) => employe.id))];
  const groupeIds = [...new Set(employesConcernes.flatMap((employe) => (employe.groupeId ? [employe.groupeId] : [])))];
  if (employeIds.length === 0) return { affectations: [], rotations: new Map(), profils: new Map() };

  const [lignes, rotations, profils] = await Promise.all([
    obtenirBase()
      .select({
        rotationId: affectations.rotationId,
        groupeId: affectations.groupeId,
        employeId: affectations.employeId,
        dateDebut: affectations.dateDebut,
        dateFin: affectations.dateFin,
      })
      .from(affectations)
      .where(groupeIds.length > 0 ? or(inArray(affectations.employeId, employeIds), inArray(affectations.groupeId, groupeIds)) : inArray(affectations.employeId, employeIds)),
    listerRotations(),
    listerProfils(),
  ]);
  return {
    affectations: lignes,
    rotations: new Map(rotations.map((rotation) => [rotation.id, rotation])),
    profils: new Map(profils.map((profil) => [profil.id, profil])),
  };
}

/** Groupe actuel de chaque employé (pour retrouver l'affectation de son groupe). */
export async function groupesDesEmployes(employeIds: string[]): Promise<{ id: string; groupeId: string | null }[]> {
  if (employeIds.length === 0) return [];
  return obtenirBase().select({ id: employes.id, groupeId: employes.groupeId }).from(employes).where(inArray(employes.id, employeIds));
}

const estEtatConnu = (etat: string): etat is EtatPointageEvalue => (ETATS_POINTAGE as readonly string[]).includes(etat);

/**
 * Statut de chaque pointage d'après le planning de son employé (même ordre que la liste).
 * Un état inconnu (donnée saisie hors de l'application) est traité comme sans planning.
 */
export async function evaluerPointages(
  liste: { employeId: string; groupeId: string | null; horodatage: Date; etat: string }[],
): Promise<StatutPointage[]> {
  const planning = await chargerPlanning(liste.map((pointage) => ({ id: pointage.employeId, groupeId: pointage.groupeId })));
  return liste.map((pointage) =>
    estEtatConnu(pointage.etat)
      ? statutPointage({ horodatage: pointage.horodatage, etat: pointage.etat }, { id: pointage.employeId, groupeId: pointage.groupeId }, planning, FUSEAU_HORAIRE)
      : { code: "aucun_planning" },
  );
}
