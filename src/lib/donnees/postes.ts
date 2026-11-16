import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { LIMITE_POSTES } from "@/lib/constantes";
import type { Poste } from "@/types";
import { obtenirBase } from "./base";
import { postes } from "./schema";

export type DonneesPoste = Omit<Poste, "id">;

export async function listerPostes(): Promise<Poste[]> {
  return obtenirBase()
    .select({
      id: postes.id,
      code: postes.code,
      nom: postes.nom,
      ordre: postes.ordre,
      parentId: postes.parentId,
      siteId: postes.siteId,
    })
    .from(postes)
    .orderBy(asc(postes.ordre), asc(postes.nom))
    .limit(LIMITE_POSTES);
}

export async function compterPostes(): Promise<number> {
  const [resultat] = await obtenirBase().select({ total: count() }).from(postes);
  return resultat?.total ?? 0;
}

export async function insererPoste(donnees: DonneesPoste): Promise<string> {
  const id = crypto.randomUUID();
  await obtenirBase().insert(postes).values({ id, ...donnees });
  return id;
}

export async function mettreAJourPoste(id: string, donnees: DonneesPoste): Promise<void> {
  await obtenirBase().update(postes).set(donnees).where(eq(postes.id, id));
}

export async function supprimerPosteParId(id: string): Promise<void> {
  await obtenirBase().delete(postes).where(eq(postes.id, id));
}
