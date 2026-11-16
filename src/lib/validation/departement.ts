import { z } from "zod";
import { LONGUEUR_MAX_NOM_DEPARTEMENT } from "@/lib/constantes";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import type { EtatFormulaireDepartement, Resultat } from "@/types";
import { siteFacultatif } from "./site";

const { erreurs } = TEXTES_DEPARTEMENTS;

const schemaDepartement = z.object({
  id: z.uuid().optional(),
  // Espaces multiples réduits à un seul : « Production   A » = « Production A ».
  nom: z
    .string()
    .transform((valeur) => valeur.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, { error: erreurs.nomVide })
        .max(LONGUEUR_MAX_NOM_DEPARTEMENT, { error: erreurs.nomTropLong }),
    ),
  // Valeur vide du menu déroulant = département principal (pas de parent).
  parentId: z
    .string()
    .transform((valeur) => (valeur === "" ? null : valeur))
    .pipe(z.uuid({ error: erreurs.parentIntrouvable }).nullable()),
  siteId: siteFacultatif,
});

export type DonneesDepartement = z.infer<typeof schemaDepartement>;

const lireTexte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");

/** Valide le formulaire de création ou de modification d'un département. */
export function validerDepartement(
  formulaire: FormData,
): Resultat<DonneesDepartement> & Pick<EtatFormulaireDepartement, "erreursChamps"> {
  const id = lireTexte(formulaire.get("id"));
  const analyse = schemaDepartement.safeParse({
    id: id === "" ? undefined : id,
    nom: lireTexte(formulaire.get("nom")),
    parentId: lireTexte(formulaire.get("parentId")),
    siteId: lireTexte(formulaire.get("siteId")),
  });

  if (analyse.success) return { ok: true, donnees: analyse.data };

  const { fieldErrors } = z.flattenError(analyse.error);
  return {
    ok: false,
    erreur: "validation",
    erreursChamps: {
      nom: fieldErrors.nom?.[0],
      parentId: fieldErrors.parentId?.[0] ?? fieldErrors.id?.[0],
      siteId: fieldErrors.siteId?.[0],
    },
  };
}
