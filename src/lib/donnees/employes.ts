import "server-only";

import { asc, count, eq } from "drizzle-orm";
import type { DonneesEmploye } from "@/lib/validation/employe";
import type { EmployeListe } from "@/types";
import { obtenirBase } from "./base";
import type { Information } from "@/lib/metier/employes";
import { departements, employes, informationsEmployes, postes } from "./schema";

/** Une page de la liste, triée par nom puis prénom. */
export async function listerEmployes(page: number, parPage: number): Promise<EmployeListe[]> {
  return obtenirBase()
    .select({
      id: employes.id,
      matricule: employes.matricule,
      numeroBadge: employes.numeroBadge,
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

/** Crée l'employé et ses informations supplémentaires dans une seule transaction. */
export async function insererEmploye(
  donnees: DonneesEmploye,
  informations: Information[],
): Promise<string> {
  const id = crypto.randomUUID();
  await obtenirBase().transaction(async (transaction) => {
    await transaction.insert(employes).values({ id, ...donnees });
    if (informations.length > 0) {
      await transaction
        .insert(informationsEmployes)
        .values(informations.map((information) => ({ employeId: id, ...information })));
    }
  });
  return id;
}

