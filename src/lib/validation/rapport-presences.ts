import { z } from "zod";
import { RAPPORT_JOURS_DEFAUT, RAPPORT_JOURS_MAX } from "@/lib/constantes";
import { ajouterJours } from "@/lib/metier/compteurs/periodes";
import { bornerPeriode } from "@/lib/metier/rapport-presences";

export type RechercheRapport = { du: string; au: string; departementId: string | null };

const estJour = (valeur: unknown): valeur is string =>
  typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valeur) && new Date(`${valeur}T00:00:00Z`).toISOString().startsWith(valeur);

/** Filtres lus dans l'URL ; une valeur invalide reprend sa valeur par défaut (30 derniers jours, tous les départements). */
export function lireRechercheRapport(parametres: Record<string, string | string[] | undefined>, aujourdhui: string): RechercheRapport {
  const au = estJour(parametres.au) ? parametres.au : aujourdhui;
  const du = estJour(parametres.du) ? parametres.du : ajouterJours(au, -(RAPPORT_JOURS_DEFAUT - 1));
  const departement = z.uuid().safeParse(parametres.departement);
  return { ...bornerPeriode({ du, au }, aujourdhui, RAPPORT_JOURS_MAX), departementId: departement.success ? departement.data : null };
}

/** Partie « ?du=…&au=… » d'un lien qui garde les filtres (exports, périodes rapides). */
export function chaineRapport(recherche: RechercheRapport): string {
  const parametres = new URLSearchParams({ du: recherche.du, au: recherche.au });
  if (recherche.departementId) parametres.set("departement", recherche.departementId);
  return `?${parametres.toString()}`;
}
