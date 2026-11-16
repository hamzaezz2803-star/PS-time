import { z } from "zod";
import {
  FORMAT_IDENTIFIANT,
  IDENTIFIANT_INSTALLATION,
  LONGUEUR_MAX_IDENTIFIANT,
  LONGUEUR_MAX_MOT_DE_PASSE,
  LONGUEUR_MIN_IDENTIFIANT,
  LONGUEUR_MIN_MOT_DE_PASSE,
} from "@/lib/constantes";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import type {
  ErreursChampsConnexion,
  IdentifiantsConnexion,
  Resultat,
} from "@/types";
import { lireTexte, premieresErreurs } from "./commun";

const { erreurs } = TEXTES_CONNEXION;
const erreursInstallation = TEXTES_CONNEXION.installation.erreurs;

const schemaConnexion = z.object({
  identifiant: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { error: erreurs.identifiantVide })
    .max(LONGUEUR_MAX_IDENTIFIANT, { error: erreurs.identifiantTropLong }),
  motDePasse: z
    .string()
    .min(1, { error: erreurs.motDePasseVide })
    .max(LONGUEUR_MAX_MOT_DE_PASSE, { error: erreurs.motDePasseTropLong }),
});

/** Valide les identifiants reçus du formulaire. Renvoie le premier message d'erreur de chaque champ. */
export function validerIdentifiants(
  identifiant: unknown,
  motDePasse: unknown,
): Resultat<IdentifiantsConnexion> & { erreursChamps?: ErreursChampsConnexion } {
  const analyse = schemaConnexion.safeParse({
    identifiant: lireTexte(identifiant),
    motDePasse: lireTexte(motDePasse),
  });

  if (analyse.success) return { ok: true, donnees: analyse.data };

  const { fieldErrors } = z.flattenError(analyse.error);
  return {
    ok: false,
    erreur: "validation",
    erreursChamps: {
      identifiant: fieldErrors.identifiant?.[0],
      motDePasse: fieldErrors.motDePasse?.[0],
    },
  };
}

const erreurIdentifiant = erreursInstallation.identifiantInvalide(LONGUEUR_MIN_IDENTIFIANT, LONGUEUR_MAX_IDENTIFIANT);

const schemaPremierCompte = z
  .object({
    jeton: z.string().min(1).max(100),
    identifiant: z
      .string()
      .trim()
      .toLowerCase()
      .min(LONGUEUR_MIN_IDENTIFIANT, { error: erreurIdentifiant })
      .max(LONGUEUR_MAX_IDENTIFIANT, { error: erreurIdentifiant })
      .regex(FORMAT_IDENTIFIANT, { error: erreurIdentifiant })
      .refine((valeur) => valeur !== IDENTIFIANT_INSTALLATION, { error: erreursInstallation.identifiantReserve }),
    nouveau: z
      .string()
      .min(LONGUEUR_MIN_MOT_DE_PASSE, { error: erreursInstallation.nouveauTropCourt(LONGUEUR_MIN_MOT_DE_PASSE) })
      .max(LONGUEUR_MAX_MOT_DE_PASSE, { error: erreursInstallation.nouveauTropLong }),
    confirmation: z.string(),
  })
  .refine((valeurs) => valeurs.nouveau === valeurs.confirmation, {
    path: ["confirmation"],
    error: erreursInstallation.confirmationDifferente,
  });

export type DonneesPremierCompte = z.infer<typeof schemaPremierCompte>;

/** Valide la fenêtre de création du premier compte (identifiant, mot de passe et confirmation). */
export function validerPremierCompte(
  formulaire: FormData,
): Resultat<DonneesPremierCompte> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaPremierCompte.safeParse({
    jeton: lireTexte(formulaire.get("jeton")),
    identifiant: lireTexte(formulaire.get("identifiant")),
    nouveau: lireTexte(formulaire.get("nouveau")),
    confirmation: lireTexte(formulaire.get("confirmation")),
  });
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}
