import "server-only";

import { asc, eq } from "drizzle-orm";
import { LIMITE_EVENEMENTS } from "@/lib/constantes";
import type { DonneesEvenement } from "@/lib/validation/evenement";
import type { Evenement } from "@/types";
import { obtenirBase } from "./base";
import { evenements, periodesEvenements } from "./schema";

/** Événements triés par code, avec leurs périodes de prise dans l'ordre du calendrier. */
export async function listerEvenements(): Promise<Evenement[]> {
  const base = obtenirBase();
  const [lignes, periodes] = await Promise.all([
    base
      .select({
        id: evenements.id,
        code: evenements.code,
        nom: evenements.nom,
        type: evenements.type,
        estSaisiEnHeures: evenements.estSaisiEnHeures,
        estPrioritaireSurPointages: evenements.estPrioritaireSurPointages,
        estVisiblePlanning: evenements.estVisiblePlanning,
        priorite: evenements.priorite,
        codePaie: evenements.codePaie,
      })
      .from(evenements)
      .orderBy(asc(evenements.code))
      .limit(LIMITE_EVENEMENTS),
    base
      .select({ evenementId: periodesEvenements.evenementId, debut: periodesEvenements.dateDebut, fin: periodesEvenements.dateFin })
      .from(periodesEvenements)
      .orderBy(asc(periodesEvenements.dateDebut)),
  ]);
  return lignes.map((evenement) => ({
    ...evenement,
    type: evenement.type === "presence" ? "presence" : "absence",
    periodes: periodes.flatMap(({ evenementId, debut, fin }) => (evenementId === evenement.id ? [{ debut, fin }] : [])),
  }));
}

/**
 * Crée (sans `id`) ou modifie un événement et remplace ses périodes, dans une transaction.
 * Renvoie l'identifiant, ou null si l'événement à modifier n'existe plus.
 */
export async function enregistrerEvenement(id: string | null, donnees: DonneesEvenement): Promise<string | null> {
  const { periodes, ...champs } = donnees;
  return obtenirBase().transaction(async (transaction) => {
    let idEvenement = id;
    if (idEvenement) {
      const [existant] = await transaction.select({ id: evenements.id }).from(evenements).where(eq(evenements.id, idEvenement)).for("update");
      if (!existant) return null;
      await transaction.update(evenements).set(champs).where(eq(evenements.id, idEvenement));
      await transaction.delete(periodesEvenements).where(eq(periodesEvenements.evenementId, idEvenement));
    } else {
      idEvenement = crypto.randomUUID();
      await transaction.insert(evenements).values({ id: idEvenement, ...champs });
    }
    if (periodes.length > 0) {
      await transaction
        .insert(periodesEvenements)
        .values(periodes.map((periode) => ({ evenementId: idEvenement, dateDebut: periode.debut, dateFin: periode.fin })));
    }
    return idEvenement;
  });
}

/** Supprime un événement et renvoie son libellé (null s'il n'existait plus). Ses périodes partent avec lui (« cascade »). */
export async function supprimerEvenementParId(id: string): Promise<string | null> {
  return obtenirBase().transaction(async (transaction) => {
    const [existant] = await transaction.select({ nom: evenements.nom }).from(evenements).where(eq(evenements.id, id)).for("update");
    if (!existant) return null;
    await transaction.delete(evenements).where(eq(evenements.id, id));
    return existant.nom;
  });
}
