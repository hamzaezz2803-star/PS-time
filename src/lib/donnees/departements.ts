import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { LIMITE_DEPARTEMENTS } from "@/lib/constantes";
import type { Departement } from "@/types";
import { obtenirBase } from "./base";
import { departements } from "./schema";

const colonnes = {
  id: departements.id,
  nom: departements.nom,
  parentId: departements.parentId,
  siteId: departements.siteId,
};

export type DonneesDepartement = Omit<Departement, "id">;

export async function listerDepartements(): Promise<Departement[]> {
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

export async function insererDepartement(donnees: DonneesDepartement): Promise<string> {
  const id = crypto.randomUUID();
  await obtenirBase().insert(departements).values({ id, ...donnees });
  return id;
}

export async function mettreAJourDepartement(id: string, donnees: DonneesDepartement): Promise<void> {
  await obtenirBase().update(departements).set(donnees).where(eq(departements.id, id));
}

export async function supprimerDepartementParId(id: string): Promise<void> {
  await obtenirBase().delete(departements).where(eq(departements.id, id));
}
