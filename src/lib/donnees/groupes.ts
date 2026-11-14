import "server-only";

import { and, asc, count, eq, inArray, isNotNull, notInArray } from "drizzle-orm";
import { LIMITE_EMPLOYES_SELECTION, LIMITE_LISTE_PROGRAMME } from "@/lib/constantes";
import type { EmployeSelection, Groupe } from "@/types";
import { obtenirBase } from "./base";
import { affectations, employes, groupes } from "./schema";

export type DonneesGroupe = { nom: string; description: string | null; membres: string[] };

/** Groupes triés par nom, avec les identifiants de leurs membres. */
export async function listerGroupes(): Promise<Groupe[]> {
  const base = obtenirBase();
  const [lignes, membres] = await Promise.all([
    base
      .select({ id: groupes.id, nom: groupes.nom, description: groupes.description })
      .from(groupes)
      .orderBy(asc(groupes.nom))
      .limit(LIMITE_LISTE_PROGRAMME),
    base.select({ id: employes.id, groupeId: employes.groupeId }).from(employes).where(isNotNull(employes.groupeId)),
  ]);
  return lignes.map((groupe) => ({
    ...groupe,
    membres: membres.filter((membre) => membre.groupeId === groupe.id).map((membre) => membre.id),
  }));
}

/** Employés proposés comme membres (nom, matricule et groupe actuel). */
export async function listerEmployesSelection(): Promise<EmployeSelection[]> {
  const lignes = await obtenirBase()
    .select({ id: employes.id, prenom: employes.prenom, nom: employes.nom, matricule: employes.matricule, groupeId: employes.groupeId })
    .from(employes)
    .orderBy(asc(employes.nom), asc(employes.prenom))
    .limit(LIMITE_EMPLOYES_SELECTION);
  return lignes.map(({ prenom, nom, ...reste }) => ({ ...reste, nomComplet: `${prenom} ${nom}` }));
}

/** Vrai si tous les identifiants désignent des employés existants. */
export async function employesExistent(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const [resultat] = await obtenirBase().select({ nombre: count() }).from(employes).where(inArray(employes.id, ids));
  return resultat.nombre === ids.length;
}

/**
 * Crée (sans `id`) ou modifie un groupe et fixe ses membres, dans une transaction : les employés
 * cochés y entrent (en quittant leur ancien groupe), les autres membres en sortent.
 * Renvoie l'identifiant, ou null si le groupe à modifier n'existe plus.
 */
export async function enregistrerGroupe(id: string | null, donnees: DonneesGroupe): Promise<string | null> {
  const { membres, ...champs } = donnees;
  return obtenirBase().transaction(async (transaction) => {
    let idGroupe = id;
    if (idGroupe) {
      const [existant] = await transaction.select({ id: groupes.id }).from(groupes).where(eq(groupes.id, idGroupe)).for("update");
      if (!existant) return null;
      await transaction.update(groupes).set(champs).where(eq(groupes.id, idGroupe));
    } else {
      idGroupe = crypto.randomUUID();
      await transaction.insert(groupes).values({ id: idGroupe, ...champs });
    }
    const sortants = membres.length > 0 ? and(eq(employes.groupeId, idGroupe), notInArray(employes.id, membres)) : eq(employes.groupeId, idGroupe);
    await transaction.update(employes).set({ groupeId: null }).where(sortants);
    if (membres.length > 0) await transaction.update(employes).set({ groupeId: idGroupe }).where(inArray(employes.id, membres));
    return idGroupe;
  });
}

/** Supprime un groupe et ses affectations ; ses membres restent, sans groupe (clé « set null »). */
export async function supprimerGroupeParId(id: string): Promise<void> {
  await obtenirBase().transaction(async (transaction) => {
    await transaction.delete(affectations).where(eq(affectations.groupeId, id));
    await transaction.delete(groupes).where(eq(groupes.id, id));
  });
}
