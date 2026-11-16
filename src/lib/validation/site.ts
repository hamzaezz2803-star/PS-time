import { z } from "zod";
import { LONGUEUR_MAX_ADRESSE_SITE, LONGUEUR_MAX_NOM_SITE } from "@/lib/constantes";
import { TEXTES_SITES } from "@/lib/textes/sites";
import type { Resultat } from "@/types";
import { lireTexte, nomObligatoire, premieresErreurs, texteFacultatif } from "./commun";

const { erreurs } = TEXTES_SITES;

const schemaSite = z.object({
  nom: nomObligatoire(LONGUEUR_MAX_NOM_SITE, erreurs.nomVide, erreurs.nomTropLong),
  adresse: texteFacultatif.pipe(
    z.string().max(LONGUEUR_MAX_ADRESSE_SITE, { error: erreurs.adresseTropLongue }).nullable(),
  ),
});

export type DonneesSite = z.infer<typeof schemaSite>;

/** Valide le formulaire de création ou de modification d'un site. */
export function validerSite(formulaire: FormData): Resultat<DonneesSite> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaSite.safeParse({
    nom: lireTexte(formulaire.get("nom")),
    adresse: lireTexte(formulaire.get("adresse")),
  });
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}

/** Site choisi dans un menu déroulant : vide = aucun site. */
export const siteFacultatif = z
  .string()
  .transform((valeur) => (valeur === "" ? null : valeur))
  .pipe(z.uuid({ error: TEXTES_SITES.champ.introuvable }).nullable());
