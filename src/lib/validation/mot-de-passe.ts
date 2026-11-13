import { z } from "zod";
import {
  LONGUEUR_MAX_MOT_DE_PASSE,
  LONGUEUR_MIN_MOT_DE_PASSE,
} from "@/lib/constantes";
import { TEXTES_MOT_DE_PASSE } from "@/lib/textes/espace";
import type {
  ChangementMotDePasse,
  EtatChangementMotDePasse,
  Resultat,
} from "@/types";

const { erreurs } = TEXTES_MOT_DE_PASSE;

const schemaChangement = z
  .object({
    actuel: z.string().min(1, { error: erreurs.actuelVide }),
    nouveau: z
      .string()
      .min(LONGUEUR_MIN_MOT_DE_PASSE, {
        error: erreurs.nouveauTropCourt(LONGUEUR_MIN_MOT_DE_PASSE),
      })
      .max(LONGUEUR_MAX_MOT_DE_PASSE, { error: erreurs.nouveauTropLong }),
    confirmation: z.string(),
  })
  .refine((valeurs) => valeurs.nouveau === valeurs.confirmation, {
    path: ["confirmation"],
    error: erreurs.confirmationDifferente,
  })
  .refine((valeurs) => valeurs.nouveau !== valeurs.actuel, {
    path: ["nouveau"],
    error: erreurs.nouveauIdentique,
  });

const lireTexte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");

/** Valide le formulaire de changement de mot de passe (premier message d'erreur par champ). */
export function validerChangementMotDePasse(
  formulaire: FormData,
): Resultat<ChangementMotDePasse> & Pick<EtatChangementMotDePasse, "erreursChamps"> {
  const analyse = schemaChangement.safeParse({
    actuel: lireTexte(formulaire.get("actuel")),
    nouveau: lireTexte(formulaire.get("nouveau")),
    confirmation: lireTexte(formulaire.get("confirmation")),
  });

  if (analyse.success) return { ok: true, donnees: analyse.data };

  const { fieldErrors } = z.flattenError(analyse.error);
  return {
    ok: false,
    erreur: "validation",
    erreursChamps: {
      actuel: fieldErrors.actuel?.[0],
      nouveau: fieldErrors.nouveau?.[0],
      confirmation: fieldErrors.confirmation?.[0],
    },
  };
}
