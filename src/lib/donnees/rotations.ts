import "server-only";

import { asc, count, eq, inArray } from "drizzle-orm";
import { LIMITE_LISTE_PROGRAMME } from "@/lib/constantes";
import type { DonneesRotation } from "@/lib/validation/rotation";
import type { Rotation } from "@/types";
import { obtenirBase } from "./base";
import { affectations, calendriers, joursRotation, rotations } from "./schema";

/** Rotations triées par nom, avec le calendrier de chaque jour travaillé. */
export async function listerRotations(): Promise<Rotation[]> {
  const base = obtenirBase();
  const [lignes, jours] = await Promise.all([
    base
      .select({ id: rotations.id, nom: rotations.nom, type: rotations.type, nombreJours: rotations.nombreJours })
      .from(rotations)
      .orderBy(asc(rotations.nom))
      .limit(LIMITE_LISTE_PROGRAMME),
    base
      .select({ rotationId: joursRotation.rotationId, numeroJour: joursRotation.numeroJour, calendrierId: joursRotation.calendrierId })
      .from(joursRotation),
  ]);
  return lignes.map((rotation) => ({
    ...rotation,
    type: rotation.type === "cycle" ? "cycle" : "hebdomadaire",
    jours: Object.fromEntries(
      jours.filter((jour) => jour.rotationId === rotation.id).map((jour) => [jour.numeroJour, jour.calendrierId]),
    ),
  }));
}

/** Vrai si tous les identifiants désignent des calendriers existants. */
export async function calendriersExistent(ids: string[]): Promise<boolean> {
  const uniques = [...new Set(ids)];
  if (uniques.length === 0) return true;
  const [resultat] = await obtenirBase().select({ nombre: count() }).from(calendriers).where(inArray(calendriers.id, uniques));
  return resultat.nombre === uniques.length;
}

/**
 * Crée (sans `id`) ou modifie une rotation et remplace ses jours, dans une transaction.
 * Renvoie l'identifiant, ou null si la rotation à modifier n'existe plus.
 */
export async function enregistrerRotation(id: string | null, donnees: DonneesRotation): Promise<string | null> {
  const { jours, ...champs } = donnees;
  return obtenirBase().transaction(async (transaction) => {
    let idRotation = id;
    if (idRotation) {
      const [existante] = await transaction.select({ id: rotations.id }).from(rotations).where(eq(rotations.id, idRotation)).for("update");
      if (!existante) return null;
      await transaction.update(rotations).set(champs).where(eq(rotations.id, idRotation));
      await transaction.delete(joursRotation).where(eq(joursRotation.rotationId, idRotation));
    } else {
      idRotation = crypto.randomUUID();
      await transaction.insert(rotations).values({ id: idRotation, ...champs });
    }
    const lignes = Object.entries(jours).map(([numeroJour, calendrierId]) => ({
      id: crypto.randomUUID(),
      rotationId: idRotation,
      numeroJour: Number(numeroJour),
      calendrierId,
    }));
    if (lignes.length > 0) await transaction.insert(joursRotation).values(lignes);
    return idRotation;
  });
}

/** Vrai si la rotation est affectée à un groupe ou à un employé (la suppression serait refusée). */
export async function rotationEstUtilisee(id: string): Promise<boolean> {
  const [ligne] = await obtenirBase().select({ id: affectations.id }).from(affectations).where(eq(affectations.rotationId, id)).limit(1);
  return ligne !== undefined;
}

/** Supprime une rotation ; ses jours partent avec elle (clé « cascade »). */
export async function supprimerRotationParId(id: string): Promise<void> {
  await obtenirBase().delete(rotations).where(eq(rotations.id, id));
}
