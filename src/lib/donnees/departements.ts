import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { LIMITE_DEPARTEMENTS } from "@/lib/constantes";
import type { ElementArbre } from "@/lib/metier/arbre";
import { obtenirBase } from "./base";
import { departements } from "./schema";

const colonnes = {
  id: departements.id,
  nom: departements.nom,
  parentId: departements.parentId,
};

export async function listerDepartements(): Promise<ElementArbre[]> {
  return obtenirBase()
    .select(colonnes)
    .from(departements)
    .orderBy(asc(departements.nom))
    .limit(LIMITE_DEPARTEMENTS);
}

export async function compterDepartements(): Promise<number> {
  const [resultat] = await obtenirBase().select({ total: count() }).from(departements);
  return resultat?.total ?? 0;
}

export async function insererDepartement(
  nom: string,
  parentId: string | null,
): Promise<string> {
  const id = crypto.randomUUID();
  await obtenirBase().insert(departements).values({ id, nom, parentId });
  return id;
}

export async function mettreAJourDepartement(
  id: string,
  nom: string,
  parentId: string | null,
): Promise<void> {
  await obtenirBase()
    .update(departements)
    .set({ nom, parentId })
    .where(eq(departements.id, id));
}

export async function supprimerDepartementParId(id: string): Promise<void> {
  await obtenirBase().delete(departements).where(eq(departements.id, id));
}

/** Vrai pour une violation d'unicité MySQL/MariaDB (nom déjà pris, enregistré entre-temps). */
export function estErreurDoublon(erreur: unknown): boolean {
  const cause = (erreur as { cause?: { code?: string } } | null)?.cause;
  return cause?.code === "ER_DUP_ENTRY";
}
