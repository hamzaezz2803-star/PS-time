import "server-only";

import { and, count, desc, eq, gte, like, lt, or, type SQL } from "drizzle-orm";
import {
  CONSERVATION_HISTORIQUE_JOURS,
  FUSEAU_HORAIRE,
  HISTORIQUE_PAR_PAGE,
  LONGUEUR_MAX_LIBELLE_NOTIFICATION,
  UN_JOUR_MILLISECONDES,
} from "@/lib/constantes";
import { ajouterJours } from "@/lib/metier/compteurs/periodes";
import {
  MODULE_DE_L_OBJET_HISTORIQUE,
  compterParAction,
  estActionHistorique,
  estModuleHistorique,
  estObjetHistorique,
  paginer,
  type ActionHistorique,
  type ObjetHistorique,
} from "@/lib/metier/historique";
import { heureLocaleVersUtc } from "@/lib/metier/pointages";
import { motifContient } from "@/lib/metier/recherche";
import type { RechercheHistorique } from "@/lib/validation/historique";
import type { EntreeHistorique } from "@/types";
import { obtenirBase } from "./base";
import { historique } from "./schema";

export type NouvelleEntreeHistorique = {
  action: ActionHistorique;
  objet: ObjetHistorique;
  libelle: string | null;
  lien: string | null;
  /** `id` null : action sans compte connecté (installation par « pstime »). */
  auteur: { id: string | null; nom: string; identifiant: string | null };
};

/** Note une action dans l'historique, et retire au passage les lignes trop anciennes. */
export async function enregistrerHistorique(nouvelle: NouvelleEntreeHistorique): Promise<void> {
  const base = obtenirBase();
  await base.insert(historique).values({
    action: nouvelle.action,
    objet: nouvelle.objet,
    module: MODULE_DE_L_OBJET_HISTORIQUE[nouvelle.objet],
    libelle: nouvelle.libelle?.slice(0, LONGUEUR_MAX_LIBELLE_NOTIFICATION) ?? null,
    lien: nouvelle.lien,
    auteurId: nouvelle.auteur.id,
    auteurNom: nouvelle.auteur.nom,
    auteurIdentifiant: nouvelle.auteur.identifiant,
  });
  const limite = new Date(Date.now() - CONSERVATION_HISTORIQUE_JOURS * UN_JOUR_MILLISECONDES);
  await base.delete(historique).where(lt(historique.creeLe, limite));
}

/** Conditions des filtres, sauf l'action (le résumé compte toutes les actions de la sélection). */
function conditions(recherche: RechercheHistorique): SQL | undefined {
  // Jours locaux (Casablanca) convertis en instants UTC : du début du premier au début du lendemain du dernier.
  const debut = heureLocaleVersUtc(recherche.du, "00:00", FUSEAU_HORAIRE);
  const fin = heureLocaleVersUtc(ajouterJours(recherche.au, 1), "00:00", FUSEAU_HORAIRE);
  const motif = recherche.texte ? motifContient(recherche.texte) : null;
  return and(
    debut ? gte(historique.creeLe, debut) : undefined,
    fin ? lt(historique.creeLe, fin) : undefined,
    recherche.auteurId ? eq(historique.auteurId, recherche.auteurId) : undefined,
    recherche.module ? eq(historique.module, recherche.module) : undefined,
    motif ? or(like(historique.libelle, motif), like(historique.auteurNom, motif), like(historique.auteurIdentifiant, motif)) : undefined,
  );
}

export type PageHistorique = {
  entrees: EntreeHistorique[];
  total: number;
  page: number;
  pages: number;
  /** Nombre d'actions de chaque type dans la sélection (sans le filtre « action »). */
  resume: Record<ActionHistorique, number>;
};

/** Une page de l'historique (le plus récent d'abord) et le résumé de la sélection. */
export async function chargerHistorique(recherche: RechercheHistorique): Promise<PageHistorique> {
  const base = obtenirBase();
  const filtre = and(conditions(recherche), recherche.action ? eq(historique.action, recherche.action) : undefined);
  const [parAction, [compte]] = await Promise.all([
    base.select({ action: historique.action, total: count() }).from(historique).where(conditions(recherche)).groupBy(historique.action),
    base.select({ total: count() }).from(historique).where(filtre),
  ]);
  const total = compte?.total ?? 0;
  const { page, pages, decalage } = paginer(total, HISTORIQUE_PAR_PAGE, recherche.page);
  const lignes = await base
    .select({
      id: historique.id,
      action: historique.action,
      objet: historique.objet,
      module: historique.module,
      libelle: historique.libelle,
      lien: historique.lien,
      auteurId: historique.auteurId,
      auteurNom: historique.auteurNom,
      auteurIdentifiant: historique.auteurIdentifiant,
      creeLe: historique.creeLe,
    })
    .from(historique)
    .where(filtre)
    .orderBy(desc(historique.creeLe), desc(historique.id))
    .limit(HISTORIQUE_PAR_PAGE)
    .offset(decalage);
  const entrees = lignes.flatMap(({ action, objet, module, ...reste }) =>
    estActionHistorique(action) && estObjetHistorique(objet) && estModuleHistorique(module) ? [{ ...reste, action, objet, module }] : [],
  );
  return { entrees, total, page, pages, resume: compterParAction(parAction) };
}

/** Auteurs présents dans l'historique (liste du filtre), comptes supprimés compris tant qu'ils ont un identifiant. */
export async function listerAuteursHistorique(): Promise<{ id: string; nom: string; identifiant: string | null }[]> {
  const lignes = await obtenirBase()
    .selectDistinct({ id: historique.auteurId, nom: historique.auteurNom, identifiant: historique.auteurIdentifiant })
    .from(historique)
    .orderBy(historique.auteurNom);
  // Un compte renommé apparaît sous plusieurs noms : un seul choix par compte.
  const parCompte = new Map<string, { id: string; nom: string; identifiant: string | null }>();
  for (const ligne of lignes) if (ligne.id && !parCompte.has(ligne.id)) parCompte.set(ligne.id, { id: ligne.id, nom: ligne.nom, identifiant: ligne.identifiant });
  return [...parCompte.values()];
}
