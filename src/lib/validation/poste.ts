import { z } from "zod";
import {
  LONGUEUR_MAX_CODE_POSTE,
  LONGUEUR_MAX_NOM_POSTE,
  ORDRE_POSTE_DEFAUT,
  ORDRE_POSTE_MAX,
  ORDRE_POSTE_MIN,
} from "@/lib/constantes";
import { TEXTES_POSTES } from "@/lib/textes/postes";
import type { EtatFormulairePoste, Resultat } from "@/types";

const { erreurs } = TEXTES_POSTES;
const erreurOrdre = erreurs.ordreInvalide(ORDRE_POSTE_MIN, ORDRE_POSTE_MAX);

const schemaPoste = z.object({
  id: z.uuid().optional(),
  code: z
    .string()
    .trim()
    .min(1, { error: erreurs.codeVide })
    .max(LONGUEUR_MAX_CODE_POSTE, { error: erreurs.codeTropLong })
    .regex(/^[\p{L}\p{N}._-]+$/u, { error: erreurs.codeInvalide }),
  nom: z
    .string()
    .transform((valeur) => valeur.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, { error: erreurs.nomVide })
        .max(LONGUEUR_MAX_NOM_POSTE, { error: erreurs.nomTropLong }),
    ),
  // Champ vide : valeur par défaut (fin de liste).
  ordre: z
    .string()
    .trim()
    .transform((valeur) => (valeur === "" ? String(ORDRE_POSTE_DEFAUT) : valeur))
    .pipe(z.string().regex(/^\d+$/, { error: erreurOrdre }))
    .transform(Number)
    .pipe(z.int().min(ORDRE_POSTE_MIN, { error: erreurOrdre }).max(ORDRE_POSTE_MAX, { error: erreurOrdre })),
  parentId: z
    .string()
    .transform((valeur) => (valeur === "" ? null : valeur))
    .pipe(z.uuid({ error: erreurs.parentIntrouvable }).nullable()),
});

export type DonneesFormulairePoste = z.infer<typeof schemaPoste>;

const lireTexte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");

/** Valide le formulaire de création ou de modification d'un poste. */
export function validerPoste(
  formulaire: FormData,
): Resultat<DonneesFormulairePoste> & Pick<EtatFormulairePoste, "erreursChamps"> {
  const id = lireTexte(formulaire.get("id"));
  const analyse = schemaPoste.safeParse({
    id: id === "" ? undefined : id,
    code: lireTexte(formulaire.get("code")),
    nom: lireTexte(formulaire.get("nom")),
    ordre: lireTexte(formulaire.get("ordre")),
    parentId: lireTexte(formulaire.get("parentId")),
  });

  if (analyse.success) return { ok: true, donnees: analyse.data };

  const { fieldErrors } = z.flattenError(analyse.error);
  return {
    ok: false,
    erreur: "validation",
    erreursChamps: {
      code: fieldErrors.code?.[0],
      nom: fieldErrors.nom?.[0],
      ordre: fieldErrors.ordre?.[0],
      parentId: fieldErrors.parentId?.[0] ?? fieldErrors.id?.[0],
    },
  };
}
