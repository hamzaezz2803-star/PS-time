import "server-only";

import { asc, count } from "drizzle-orm";
import { LIMITE_CHAMPS_PERSONNALISES, TYPES_CHAMP_PERSONNALISE } from "@/lib/constantes";
import type { ChampPersonnalise, TypeChampPersonnalise } from "@/types";
import { obtenirBase } from "./base";
import { champsPersonnalises } from "./schema";

// La contrainte `check` garantit le type en base ; repli sur « texte » si la donnée a été modifiée à la main.
const lireType = (type: string): TypeChampPersonnalise =>
  TYPES_CHAMP_PERSONNALISE.find((valide) => valide === type) ?? "texte";

/** Champs facultatifs dans leur ordre de création. */
export async function listerChampsPersonnalises(): Promise<ChampPersonnalise[]> {
  const lignes = await obtenirBase()
    .select({
      id: champsPersonnalises.id,
      nom: champsPersonnalises.nom,
      type: champsPersonnalises.type,
    })
    .from(champsPersonnalises)
    .orderBy(asc(champsPersonnalises.creeLe), asc(champsPersonnalises.nom))
    .limit(LIMITE_CHAMPS_PERSONNALISES);
  return lignes.map((ligne) => ({ ...ligne, type: lireType(ligne.type) }));
}

export async function compterChampsPersonnalises(): Promise<number> {
  const [resultat] = await obtenirBase().select({ total: count() }).from(champsPersonnalises);
  return resultat?.total ?? 0;
}

export async function insererChampPersonnalise(
  nom: string,
  type: TypeChampPersonnalise,
): Promise<ChampPersonnalise> {
  const id = crypto.randomUUID();
  await obtenirBase().insert(champsPersonnalises).values({ id, nom, type });
  return { id, nom, type };
}
