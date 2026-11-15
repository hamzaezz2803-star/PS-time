import "server-only";

import { asc, count, eq, isNotNull } from "drizzle-orm";
import type { DonneesEmploye } from "@/lib/validation/employe";
import type { EmployeDetail, EmployeListe } from "@/types";
import { obtenirBase } from "./base";
import type { Information } from "@/lib/metier/employes";
import { affectations, departements, employes, informationsEmployes, postes } from "./schema";

/** Une page de la liste, triée par nom puis prénom. */
export async function listerEmployes(page: number, parPage: number): Promise<EmployeListe[]> {
  return requeteListeEmployes().limit(parPage).offset((page - 1) * parPage);
}

/** Toute la liste (export Excel ou PDF), dans le même ordre, bornée par `maximum`. */
export async function listerEmployesPourExport(maximum: number): Promise<EmployeListe[]> {
  return requeteListeEmployes().limit(maximum);
}

/** Colonnes de la liste : jamais de pièce d'identité ni d'e-mail (minimisation). */
function requeteListeEmployes() {
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
    .$dynamic();
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


/** Fiche complète d'un employé avec ses informations supplémentaires, ou null s'il n'existe plus. */
export async function obtenirEmploye(id: string): Promise<EmployeDetail | null> {
  const base = obtenirBase();
  const [employe] = await base
    .select({
      id: employes.id,
      matricule: employes.matricule,
      numeroBadge: employes.numeroBadge,
      prenom: employes.prenom,
      nom: employes.nom,
      departementId: employes.departementId,
      departement: departements.nom,
      posteId: employes.posteId,
      poste: postes.nom,
      genre: employes.genre,
      typePieceIdentite: employes.typePieceIdentite,
      numeroPieceIdentite: employes.numeroPieceIdentite,
      telephone: employes.telephone,
      email: employes.email,
      typeEmploi: employes.typeEmploi,
      dateEmbauche: employes.dateEmbauche,
      dateDebutEmploi: employes.dateDebutEmploi,
      dateFinEmploi: employes.dateFinEmploi,
    })
    .from(employes)
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .leftJoin(postes, eq(postes.id, employes.posteId))
    .where(eq(employes.id, id))
    .limit(1);
  if (!employe) return null;

  const informations = await base
    .select({ libelle: informationsEmployes.libelle, valeur: informationsEmployes.valeur })
    .from(informationsEmployes)
    .where(eq(informationsEmployes.employeId, id))
    .orderBy(asc(informationsEmployes.creeLe), asc(informationsEmployes.libelle));
  return { ...employe, informations };
}

/**
 * Met à jour l'employé et remplace ses informations supplémentaires, dans une seule transaction.
 * Renvoie false si l'employé n'existe plus.
 */
export async function mettreAJourEmploye(
  id: string,
  donnees: DonneesEmploye,
  informations: Information[],
): Promise<boolean> {
  return obtenirBase().transaction(async (transaction) => {
    const [existant] = await transaction
      .select({ id: employes.id })
      .from(employes)
      .where(eq(employes.id, id))
      .limit(1)
      .for("update");
    if (!existant) return false;

    await transaction.update(employes).set(donnees).where(eq(employes.id, id));
    await transaction.delete(informationsEmployes).where(eq(informationsEmployes.employeId, id));
    if (informations.length > 0) {
      await transaction
        .insert(informationsEmployes)
        .values(informations.map((information) => ({ employeId: id, ...information })));
    }
    return true;
  });
}

/**
 * Supprime l'employé et ses affectations de rotation (transaction) ; ses informations
 * supplémentaires partent avec lui (cascade).
 */
export async function supprimerEmployeParId(id: string): Promise<void> {
  await obtenirBase().transaction(async (transaction) => {
    await transaction.delete(affectations).where(eq(affectations.employeId, id));
    await transaction.delete(employes).where(eq(employes.id, id));
  });
}

/** Nombre d'employés rattachés directement à chaque département (identifiant → nombre). */
export async function compterEmployesParDepartement(): Promise<Record<string, number>> {
  const lignes = await obtenirBase()
    .select({ id: employes.departementId, total: count() })
    .from(employes)
    .groupBy(employes.departementId);
  return Object.fromEntries(lignes.map((ligne) => [ligne.id, ligne.total]));
}

/** Nombre d'employés qui occupent chaque poste (identifiant → nombre). */
export async function compterEmployesParPoste(): Promise<Record<string, number>> {
  const lignes = await obtenirBase()
    .select({ id: employes.posteId, total: count() })
    .from(employes)
    .where(isNotNull(employes.posteId))
    .groupBy(employes.posteId);
  return Object.fromEntries(lignes.flatMap((ligne) => (ligne.id ? [[ligne.id, ligne.total]] : [])));
}
