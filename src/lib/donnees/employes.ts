import "server-only";

import { and, asc, count, eq, inArray, isNotNull, like, or, type SQL } from "drizzle-orm";
import { idsDescendants } from "@/lib/metier/arbre";
import { motifContient } from "@/lib/metier/recherche";
import type { RechercheEmployes } from "@/lib/validation/recherche-employes";
import type { DonneesEmploye } from "@/lib/validation/employe";
import type { EmployeDetail, EmployeListe } from "@/types";
import { obtenirBase } from "./base";
import type { Information } from "@/lib/metier/employes";
import { appliquerChangementPhoto, type ChangementPhoto } from "./photos-employes";
import { affectations, departements, employes, informationsEmployes, photosEmployes, postes, sites } from "./schema";

/** Aucun critère : toute la liste. */
const SANS_RECHERCHE: RechercheEmployes = { nom: "", matricule: "", departementId: null };

/**
 * Condition SQL des critères de recherche (requêtes paramétrées). Un département
 * inclut ses sous-départements, comme les compteurs de l'arbre.
 */
async function conditionRecherche(recherche: RechercheEmployes): Promise<SQL | undefined> {
  const conditions: (SQL | undefined)[] = [];
  if (recherche.nom) {
    const motif = motifContient(recherche.nom);
    conditions.push(or(like(employes.nom, motif), like(employes.prenom, motif)));
  }
  if (recherche.matricule) {
    const motif = motifContient(recherche.matricule);
    conditions.push(or(like(employes.matricule, motif), like(employes.numeroBadge, motif)));
  }
  if (recherche.departementId) {
    const tous = await obtenirBase().select({ id: departements.id, nom: departements.nom, parentId: departements.parentId }).from(departements);
    const ids = [recherche.departementId, ...idsDescendants(tous, recherche.departementId)];
    conditions.push(inArray(employes.departementId, ids));
  }
  return and(...conditions);
}

/** Une page de la liste, triée par nom puis prénom, filtrée par les critères de recherche. */
export async function listerEmployes(page: number, parPage: number, recherche = SANS_RECHERCHE): Promise<EmployeListe[]> {
  return requeteListeEmployes()
    .where(await conditionRecherche(recherche))
    .limit(parPage)
    .offset((page - 1) * parPage);
}

/** Toute la liste (export Excel ou PDF), dans le même ordre et avec les mêmes critères, bornée par `maximum`. */
export async function listerEmployesPourExport(maximum: number, recherche = SANS_RECHERCHE): Promise<EmployeListe[]> {
  return requeteListeEmployes().where(await conditionRecherche(recherche)).limit(maximum);
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
      photoModifieeLe: photosEmployes.modifieLe,
    })
    .from(employes)
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .leftJoin(postes, eq(postes.id, employes.posteId))
    .leftJoin(photosEmployes, eq(photosEmployes.employeId, employes.id))
    .orderBy(asc(employes.nom), asc(employes.prenom), asc(employes.matricule))
    .$dynamic();
}

export async function compterEmployes(recherche = SANS_RECHERCHE): Promise<number> {
  const [resultat] = await obtenirBase().select({ total: count() }).from(employes).where(await conditionRecherche(recherche));
  return resultat?.total ?? 0;
}

/** Crée l'employé, ses informations supplémentaires et sa photo dans une seule transaction. */
export async function insererEmploye(
  donnees: DonneesEmploye,
  informations: Information[],
  photo: ChangementPhoto = { action: "garder" },
): Promise<string> {
  const id = crypto.randomUUID();
  await obtenirBase().transaction(async (transaction) => {
    await transaction.insert(employes).values({ id, ...donnees });
    if (informations.length > 0) {
      await transaction
        .insert(informationsEmployes)
        .values(informations.map((information) => ({ employeId: id, ...information })));
    }
    await appliquerChangementPhoto(transaction, id, photo);
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
      siteId: employes.siteId,
      site: sites.nom,
      genre: employes.genre,
      typePieceIdentite: employes.typePieceIdentite,
      numeroPieceIdentite: employes.numeroPieceIdentite,
      telephone: employes.telephone,
      email: employes.email,
      typeEmploi: employes.typeEmploi,
      dateEmbauche: employes.dateEmbauche,
      dateDebutEmploi: employes.dateDebutEmploi,
      dateFinEmploi: employes.dateFinEmploi,
      photoModifieeLe: photosEmployes.modifieLe,
    })
    .from(employes)
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .leftJoin(postes, eq(postes.id, employes.posteId))
    .leftJoin(sites, eq(sites.id, employes.siteId))
    .leftJoin(photosEmployes, eq(photosEmployes.employeId, employes.id))
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
 * Met à jour l'employé, remplace ses informations supplémentaires et applique le changement
 * de photo, dans une seule transaction.
 * Renvoie false si l'employé n'existe plus.
 */
export async function mettreAJourEmploye(
  id: string,
  donnees: DonneesEmploye,
  informations: Information[],
  photo: ChangementPhoto = { action: "garder" },
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
    await appliquerChangementPhoto(transaction, id, photo);
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
