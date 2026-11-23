import "server-only";

import { asc, eq } from "drizzle-orm";
import { LIMITE_EVENEMENTS } from "@/lib/constantes";
import type { DonneesEvenement } from "@/lib/validation/evenement";
import type { Evenement, UniteSaisieEvenement } from "@/types";
import { obtenirBase } from "./base";
import { evenements } from "./schema";

/** Unité lue en base (contrainte `check`), ramenée à la journée si elle était inconnue. */
const lireUnite = (unite: string): UniteSaisieEvenement => (unite === "heures" || unite === "demi_journee" ? unite : "journee");

/** Événements triés par code. */
export async function listerEvenements(): Promise<Evenement[]> {
  const lignes = await obtenirBase()
    .select({
      id: evenements.id,
      code: evenements.code,
      nom: evenements.nom,
      type: evenements.type,
      uniteSaisie: evenements.uniteSaisie,
      dureeMinutes: evenements.dureeMinutes,
      estPrioritaireSurPointages: evenements.estPrioritaireSurPointages,
      estSoumisDroits: evenements.estSoumisDroits,
      estVisiblePlanning: evenements.estVisiblePlanning,
      priorite: evenements.priorite,
      codePaie: evenements.codePaie,
    })
    .from(evenements)
    .orderBy(asc(evenements.code))
    .limit(LIMITE_EVENEMENTS);
  return lignes.map((evenement) => ({
    ...evenement,
    type: evenement.type === "presence" ? "presence" : "absence",
    uniteSaisie: lireUnite(evenement.uniteSaisie),
  }));
}

/**
 * Crée (sans `id`) ou modifie un événement, dans une transaction.
 * Renvoie l'identifiant, ou null si l'événement à modifier n'existe plus.
 */
export async function enregistrerEvenement(id: string | null, donnees: DonneesEvenement): Promise<string | null> {
  return obtenirBase().transaction(async (transaction) => {
    if (!id) {
      const idEvenement = crypto.randomUUID();
      await transaction.insert(evenements).values({ id: idEvenement, ...donnees });
      return idEvenement;
    }
    const [existant] = await transaction.select({ id: evenements.id }).from(evenements).where(eq(evenements.id, id)).for("update");
    if (!existant) return null;
    await transaction.update(evenements).set(donnees).where(eq(evenements.id, id));
    return id;
  });
}

/** Supprime un événement et renvoie son libellé (null s'il n'existait plus). */
export async function supprimerEvenementParId(id: string): Promise<string | null> {
  return obtenirBase().transaction(async (transaction) => {
    const [existant] = await transaction.select({ nom: evenements.nom }).from(evenements).where(eq(evenements.id, id)).for("update");
    if (!existant) return null;
    await transaction.delete(evenements).where(eq(evenements.id, id));
    return existant.nom;
  });
}
