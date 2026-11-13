import { z } from "zod";
import { LONGUEUR_MAX_EMAIL, LONGUEUR_MAX_MOT_DE_PASSE } from "@/lib/constantes";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import type {
  ErreursChampsConnexion,
  IdentifiantsConnexion,
  Resultat,
} from "@/types";

const { erreurs } = TEXTES_CONNEXION;

const schemaConnexion = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { error: erreurs.emailVide })
    .max(LONGUEUR_MAX_EMAIL, { error: erreurs.emailTropLong })
    .pipe(z.email({ error: erreurs.emailInvalide })),
  motDePasse: z
    .string()
    .min(1, { error: erreurs.motDePasseVide })
    .max(LONGUEUR_MAX_MOT_DE_PASSE, { error: erreurs.motDePasseTropLong }),
});

function lireTexte(valeur: unknown): string {
  return typeof valeur === "string" ? valeur : "";
}

/** Valide les identifiants reçus du formulaire. Renvoie le premier message d'erreur de chaque champ. */
export function validerIdentifiants(
  email: unknown,
  motDePasse: unknown,
): Resultat<IdentifiantsConnexion> & { erreursChamps?: ErreursChampsConnexion } {
  const analyse = schemaConnexion.safeParse({
    email: lireTexte(email),
    motDePasse: lireTexte(motDePasse),
  });

  if (analyse.success) return { ok: true, donnees: analyse.data };

  const { fieldErrors } = z.flattenError(analyse.error);
  return {
    ok: false,
    erreur: "validation",
    erreursChamps: {
      email: fieldErrors.email?.[0],
      motDePasse: fieldErrors.motDePasse?.[0],
    },
  };
}
