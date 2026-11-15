import { z } from "zod";
import { LONGUEUR_MAX_RECHERCHE } from "@/lib/constantes";

/** Critères de recherche des employés, lus dans l'URL. */
export type RechercheEmployes = {
  /** Nom ou prénom. */
  nom: string;
  /** Matricule ou numéro de badge. */
  matricule: string;
  /** Département (sous-départements compris), ou null pour tous. */
  departementId: string | null;
};

type ParametresUrl = Record<string, string | string[] | undefined>;

// Une valeur invalide (trop longue, mauvais identifiant, répétée) est ignorée : la liste reste utilisable.
const texte = z.string().trim().max(LONGUEUR_MAX_RECHERCHE).catch("");
const schema = z.object({
  nom: texte,
  matricule: texte,
  departement: z.uuid().nullable().catch(null),
});

/** Lit et valide les critères de recherche de l'URL (jamais utilisés tels quels). */
export function lireRechercheEmployes(parametres: ParametresUrl): RechercheEmployes {
  const brut = (cle: string) => (typeof parametres[cle] === "string" ? parametres[cle] : undefined);
  const resultat = schema.parse({ nom: brut("nom") ?? "", matricule: brut("matricule") ?? "", departement: brut("departement") || null });
  return { nom: resultat.nom, matricule: resultat.matricule, departementId: resultat.departement };
}

export function aDesCriteres(recherche: RechercheEmployes): boolean {
  return recherche.nom !== "" || recherche.matricule !== "" || recherche.departementId !== null;
}

/** Paramètres d'URL des critères (pour la pagination et les exports). */
export function parametresRecherche(recherche: RechercheEmployes) {
  return { nom: recherche.nom, matricule: recherche.matricule, departement: recherche.departementId };
}
