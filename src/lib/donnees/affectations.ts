import "server-only";

import { and, asc, desc, eq, ne } from "drizzle-orm";
import { LIMITE_LISTE_PROGRAMME } from "@/lib/constantes";
import { periodesSeChevauchent } from "@/lib/metier/programme";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { DonneesAffectation } from "@/lib/validation/affectation";
import type { Affectation } from "@/types";
import { obtenirBase, type Base } from "./base";
import { affectations, employes, groupes, rotations } from "./schema";

const textes = TEXTES_PROGRAMME.affectations;

/** Affectations, les plus récentes d'abord, avec le nom de la rotation et de la cible. */
export async function listerAffectations(): Promise<Affectation[]> {
  const lignes = await obtenirBase()
    .select({
      id: affectations.id,
      rotationId: affectations.rotationId,
      rotation: rotations.nom,
      groupeId: affectations.groupeId,
      employeId: affectations.employeId,
      groupe: groupes.nom,
      prenom: employes.prenom,
      nomEmploye: employes.nom,
      dateDebut: affectations.dateDebut,
      dateFin: affectations.dateFin,
    })
    .from(affectations)
    .innerJoin(rotations, eq(rotations.id, affectations.rotationId))
    .leftJoin(groupes, eq(groupes.id, affectations.groupeId))
    .leftJoin(employes, eq(employes.id, affectations.employeId))
    .orderBy(desc(affectations.dateDebut), asc(rotations.nom))
    .limit(LIMITE_LISTE_PROGRAMME);
  return lignes.map(({ groupe, prenom, nomEmploye, ...affectation }) => {
    const cible = groupe !== null ? textes.groupe(groupe) : `${prenom ?? ""} ${nomEmploye ?? ""}`.trim();
    return { ...affectation, cible, nom: textes.nomAffectation(cible, affectation.rotation) };
  });
}

type Transaction = Parameters<Parameters<Base["transaction"]>[0]>[0];

/** Verrouille la cible et la rotation ; faux si l'une d'elles n'existe plus. */
async function verrouillerReferences(transaction: Transaction, donnees: DonneesAffectation): Promise<boolean> {
  const [rotation] = await transaction.select({ id: rotations.id }).from(rotations).where(eq(rotations.id, donnees.rotationId)).for("update");
  const [cible] = donnees.groupeId
    ? await transaction.select({ id: groupes.id }).from(groupes).where(eq(groupes.id, donnees.groupeId)).for("update")
    : await transaction.select({ id: employes.id }).from(employes).where(eq(employes.id, donnees.employeId ?? "")).for("update");
  return rotation !== undefined && cible !== undefined;
}

export type ResultatEnregistrementAffectation = { ok: true; id: string } | { ok: false; erreur: "introuvable" | "references" | "chevauchement" };

/**
 * Crée (sans `id`) ou modifie une affectation, en refusant qu'elle chevauche une autre
 * affectation de la même cible. La cible est verrouillée pour éviter deux créations simultanées.
 */
export async function enregistrerAffectation(id: string | null, donnees: DonneesAffectation): Promise<ResultatEnregistrementAffectation> {
  return obtenirBase().transaction(async (transaction) => {
    if (!(await verrouillerReferences(transaction, donnees))) return { ok: false, erreur: "references" };
    const memeCible = donnees.groupeId ? eq(affectations.groupeId, donnees.groupeId) : eq(affectations.employeId, donnees.employeId ?? "");
    const autres = await transaction
      .select({ debut: affectations.dateDebut, fin: affectations.dateFin })
      .from(affectations)
      .where(id ? and(memeCible, ne(affectations.id, id)) : memeCible);
    if (autres.some((autre) => periodesSeChevauchent(autre, { debut: donnees.dateDebut, fin: donnees.dateFin }))) {
      return { ok: false, erreur: "chevauchement" };
    }
    if (id) {
      const resultat = await transaction.update(affectations).set(donnees).where(eq(affectations.id, id));
      return (resultat.rowCount ?? 0) > 0 ? { ok: true, id } : { ok: false, erreur: "introuvable" };
    }
    const nouvelId = crypto.randomUUID();
    await transaction.insert(affectations).values({ id: nouvelId, ...donnees });
    return { ok: true, id: nouvelId };
  });
}

export async function supprimerAffectationParId(id: string): Promise<void> {
  await obtenirBase().delete(affectations).where(eq(affectations.id, id));
}
