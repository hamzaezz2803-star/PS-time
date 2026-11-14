import { z } from "zod";
import { LIMITE_EMPLOYES_SELECTION, LONGUEUR_MAX_DESCRIPTION_GROUPE, LONGUEUR_MAX_NOM_PROGRAMME } from "@/lib/constantes";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Resultat } from "@/types";
import { lireTexte, nomObligatoire, premieresErreurs, texteFacultatif } from "./commun";

const textes = TEXTES_PROGRAMME.groupes;

const schemaGroupe = z.object({
  nom: nomObligatoire(LONGUEUR_MAX_NOM_PROGRAMME, textes.nomVide, textes.nomTropLong),
  description: texteFacultatif.pipe(
    z.string().max(LONGUEUR_MAX_DESCRIPTION_GROUPE, { error: textes.erreurs.descriptionTropLongue }).nullable(),
  ),
  // Doublons retirés : une case ne peut être cochée qu'une fois, mais l'entrée vient du navigateur.
  membres: z
    .array(z.uuid({ error: textes.erreurs.membreIntrouvable }))
    .max(LIMITE_EMPLOYES_SELECTION, { error: textes.erreurs.membreIntrouvable })
    .transform((ids) => [...new Set(ids)]),
});

export type DonneesGroupeValidees = z.infer<typeof schemaGroupe>;

/** Valide le formulaire d'un groupe (les membres arrivent sous le nom « membres », un par case cochée). */
export function validerGroupe(
  formulaire: FormData,
): Resultat<DonneesGroupeValidees> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaGroupe.safeParse({
    nom: lireTexte(formulaire.get("nom")),
    description: lireTexte(formulaire.get("description")),
    membres: formulaire.getAll("membres").map(lireTexte),
  });
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}
