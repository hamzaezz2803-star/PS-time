import "server-only";

import { asc, count, eq, isNotNull } from "drizzle-orm";
import { LIMITE_SITES } from "@/lib/constantes";
import type { DonneesSite } from "@/lib/validation/site";
import type { Site } from "@/types";
import { obtenirBase } from "./base";
import { departements, employes, postes, sites } from "./schema";

type TableAvecSite = typeof departements | typeof postes | typeof employes;

/** Nombre de lignes rattachées à chaque site (identifiant du site → nombre). */
async function compterParSite(table: TableAvecSite): Promise<Map<string, number>> {
  const lignes = await obtenirBase()
    .select({ id: table.siteId, total: count() })
    .from(table)
    .where(isNotNull(table.siteId))
    .groupBy(table.siteId);
  return new Map(lignes.flatMap((ligne) => (ligne.id ? [[ligne.id, ligne.total] as const] : [])));
}

/** Sites triés par nom, avec le nombre de départements, postes et employés rattachés. */
export async function listerSites(): Promise<Site[]> {
  const [lignes, parDepartement, parPoste, parEmploye] = await Promise.all([
    obtenirBase()
      .select({ id: sites.id, nom: sites.nom, adresse: sites.adresse })
      .from(sites)
      .orderBy(asc(sites.nom))
      .limit(LIMITE_SITES),
    compterParSite(departements),
    compterParSite(postes),
    compterParSite(employes),
  ]);
  return lignes.map((site) => ({
    ...site,
    nombreDepartements: parDepartement.get(site.id) ?? 0,
    nombrePostes: parPoste.get(site.id) ?? 0,
    nombreEmployes: parEmploye.get(site.id) ?? 0,
  }));
}

/** Sites proposés dans les menus déroulants (identifiant et nom). */
export async function listerOptionsSites(): Promise<{ valeur: string; libelle: string }[]> {
  const lignes = await obtenirBase()
    .select({ valeur: sites.id, libelle: sites.nom })
    .from(sites)
    .orderBy(asc(sites.nom))
    .limit(LIMITE_SITES);
  return lignes;
}

/** Vrai si le site existe (null = aucun site, toujours accepté). */
export async function siteExiste(id: string | null): Promise<boolean> {
  if (id === null) return true;
  const [ligne] = await obtenirBase().select({ id: sites.id }).from(sites).where(eq(sites.id, id)).limit(1);
  return ligne !== undefined;
}

/** Crée (sans `id`) ou modifie un site. Renvoie son identifiant, ou null s'il n'existe plus. */
export async function enregistrerSite(id: string | null, donnees: DonneesSite): Promise<string | null> {
  const base = obtenirBase();
  if (id === null) {
    const nouvelId = crypto.randomUUID();
    await base.insert(sites).values({ id: nouvelId, ...donnees });
    return nouvelId;
  }
  if (!(await siteExiste(id))) return null;
  await base.update(sites).set(donnees).where(eq(sites.id, id));
  return id;
}

/** Supprime un site ; refusé par la base (restrict) s'il est encore rattaché à quelque chose. */
export async function supprimerSiteParId(id: string): Promise<void> {
  await obtenirBase().delete(sites).where(eq(sites.id, id));
}
