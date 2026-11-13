import "server-only";

import { asc, count, eq } from "drizzle-orm";
import type { DonneesEmploye } from "@/lib/validation/employe";
import type { EmployeListe } from "@/types";
import { obtenirBase } from "./base";
import { departements, employes, postes, valeursChampsPersonnalises } from "./schema";

export type ValeurChamp = { champId: string; valeur: string };

/** Une page de la liste, triée par nom puis prénom. */
export async function listerEmployes(page: number, parPage: number): Promise<EmployeListe[]> {
  return obtenirBase()
    .select({
      id: employes.id,
      matricule: employes.matricule,
      prenom: employes.prenom,
      nom: employes.nom,
      departement: departements.nom,
      poste: postes.nom,
      telephone: employes.telephone,
      dateEmbauche: employes.dateEmbauche,
    })
    .from(employes)
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .leftJoin(postes, eq(postes.id, employes.posteId))
    .orderBy(asc(employes.nom), asc(employes.prenom), asc(employes.matricule))
    .limit(parPage)
    .offset((page - 1) * parPage);
}

export async function compterEmployes(): Promise<number> {
  const [resultat] = await obtenirBase().select({ total: count() }).from(employes);
  return resultat?.total ?? 0;
}

/** Crée l'employé et ses valeurs de champs facultatifs dans une seule transaction. */
export async function insererEmploye(
  donnees: DonneesEmploye,
  valeurs: ValeurChamp[],
): Promise<string> {
  const id = crypto.randomUUID();
  await obtenirBase().transaction(async (transaction) => {
    await transaction.insert(employes).values({ id, ...donnees });
    if (valeurs.length > 0) {
      await transaction
        .insert(valeursChampsPersonnalises)
        .values(valeurs.map((valeur) => ({ employeId: id, ...valeur })));
    }
  });
  return id;
}
