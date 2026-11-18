import { z } from "zod";
import { HISTORIQUE_JOURS_DEFAUT, HISTORIQUE_JOURS_MAX, LONGUEUR_MAX_RECHERCHE } from "@/lib/constantes";
import { ajouterJours } from "@/lib/metier/compteurs/periodes";
import { estActionHistorique, estModuleHistorique, type ActionHistorique, type ModuleHistorique } from "@/lib/metier/historique";
import { bornerPeriode } from "@/lib/metier/rapport-presences";
import { chaineRecherche } from "@/lib/metier/recherche";

export type RechercheHistorique = {
  du: string;
  au: string;
  auteurId: string | null;
  module: ModuleHistorique | null;
  action: ActionHistorique | null;
  texte: string;
  page: number;
};

type Parametres = Record<string, string | string[] | undefined>;

const premier = (valeur: string | string[] | undefined) => (Array.isArray(valeur) ? valeur[0] : valeur) ?? "";
const estJour = (valeur: string) => /^\d{4}-\d{2}-\d{2}$/.test(valeur) && new Date(`${valeur}T00:00:00Z`).toISOString().startsWith(valeur);

/** Filtres lus dans l'URL ; une valeur invalide reprend sa valeur par défaut (30 derniers jours, tout). */
export function lireRechercheHistorique(parametres: Parametres, aujourdhui: string): RechercheHistorique {
  const [du, au, auteur, module, action] = ["du", "au", "auteur", "module", "action"].map((cle) => premier(parametres[cle]));
  const fin = estJour(au) ? au : aujourdhui;
  const debut = estJour(du) ? du : ajouterJours(fin, -(HISTORIQUE_JOURS_DEFAUT - 1));
  return {
    ...bornerPeriode({ du: debut, au: fin }, aujourdhui, HISTORIQUE_JOURS_MAX),
    auteurId: z.uuid().safeParse(auteur).success ? auteur : null,
    module: estModuleHistorique(module) ? module : null,
    action: estActionHistorique(action) ? action : null,
    texte: premier(parametres.q).trim().slice(0, LONGUEUR_MAX_RECHERCHE),
    page: Number.parseInt(premier(parametres.page), 10) || 1,
  };
}

/** Partie « ?du=…&au=… » d'un lien qui garde les filtres (pages, périodes rapides). */
export function chaineHistorique(recherche: RechercheHistorique, page = 1): string {
  const { du, au, auteurId, module, action, texte } = recherche;
  return chaineRecherche({ du, au, auteur: auteurId, module, action, q: texte, page: page > 1 ? page : null });
}
