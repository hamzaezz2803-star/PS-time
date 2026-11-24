import { LONGUEUR_MAX_RECHERCHE } from "@/lib/constantes";
import { lireRechercheRapport, type RechercheRapport } from "./rapport-presences";

/** Filtres d'un état : période (93 jours au plus, jamais dans le futur), département, employé (nom ou matricule). */
export type RechercheEtat = RechercheRapport & { employe: string };

/** Filtres lus dans l'URL ; une valeur invalide reprend sa valeur par défaut (30 derniers jours, tout le monde). */
export function lireRechercheEtat(parametres: Record<string, string | string[] | undefined>, aujourdhui: string): RechercheEtat {
  const employe = typeof parametres.employe === "string" ? parametres.employe.trim().slice(0, LONGUEUR_MAX_RECHERCHE) : "";
  return { ...lireRechercheRapport(parametres, aujourdhui), employe };
}

/** Partie « ?du=…&au=… » d'un lien qui garde les filtres (exports, périodes rapides). */
export function chaineEtat(recherche: RechercheEtat): string {
  const parametres = new URLSearchParams({ du: recherche.du, au: recherche.au });
  if (recherche.departementId) parametres.set("departement", recherche.departementId);
  if (recherche.employe) parametres.set("employe", recherche.employe);
  return `?${parametres.toString()}`;
}
