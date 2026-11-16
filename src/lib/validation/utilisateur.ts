import { z } from "zod";
import {
  FORMAT_IDENTIFIANT,
  IDENTIFIANT_INSTALLATION,
  LONGUEUR_MAX_IDENTIFIANT,
  LONGUEUR_MAX_MOT_DE_PASSE,
  LONGUEUR_MAX_NOM_UTILISATEUR,
  LONGUEUR_MIN_IDENTIFIANT,
  LONGUEUR_MIN_MOT_DE_PASSE,
} from "@/lib/constantes";
import { nettoyerModules } from "@/lib/metier/droits";
import { TEXTES_UTILISATEURS } from "@/lib/textes/utilisateurs";
import type { Resultat } from "@/types";
import { lireTexte, nomObligatoire, premieresErreurs } from "./commun";

const { erreurs } = TEXTES_UTILISATEURS;
const erreurIdentifiant = erreurs.identifiantInvalide(LONGUEUR_MIN_IDENTIFIANT, LONGUEUR_MAX_IDENTIFIANT);

const motDePasse = z
  .string()
  .min(LONGUEUR_MIN_MOT_DE_PASSE, { error: erreurs.motDePasseTropCourt(LONGUEUR_MIN_MOT_DE_PASSE) })
  .max(LONGUEUR_MAX_MOT_DE_PASSE, { error: erreurs.motDePasseTropLong });

const champsCommuns = {
  nom: nomObligatoire(LONGUEUR_MAX_NOM_UTILISATEUR, erreurs.nomVide, erreurs.nomTropLong),
  // Cases cochées « modules » : seules les valeurs connues sont gardées.
  modules: z.array(z.string()).transform(nettoyerModules),
  confirmation: z.string(),
};

const confirmationIdentique = {
  path: ["confirmation"],
  error: erreurs.confirmationDifferente,
};

const schemaCreation = z
  .object({
    ...champsCommuns,
    identifiant: z
      .string()
      .trim()
      .toLowerCase()
      .min(LONGUEUR_MIN_IDENTIFIANT, { error: erreurIdentifiant })
      .max(LONGUEUR_MAX_IDENTIFIANT, { error: erreurIdentifiant })
      .regex(FORMAT_IDENTIFIANT, { error: erreurIdentifiant })
      .refine((valeur) => valeur !== IDENTIFIANT_INSTALLATION, { error: erreurs.identifiantReserve }),
    motDePasse,
  })
  .refine((valeurs) => valeurs.motDePasse === valeurs.confirmation, confirmationIdentique);

const schemaModification = z
  .object({
    ...champsCommuns,
    id: z.uuid(),
    estActif: z.boolean(),
    // Vide : le mot de passe actuel est gardé.
    motDePasse: z.string().transform((valeur) => (valeur === "" ? null : valeur)).pipe(motDePasse.nullable()),
  })
  .refine((valeurs) => (valeurs.motDePasse ?? "") === valeurs.confirmation, confirmationIdentique);

export type DonneesCreationUtilisateur = z.infer<typeof schemaCreation>;
export type DonneesModificationUtilisateur = z.infer<typeof schemaModification>;
type ResultatValidation<T> = Resultat<T> & { erreursChamps?: Record<string, string> };

function lireCommuns(formulaire: FormData) {
  return {
    nom: lireTexte(formulaire.get("nom")),
    modules: formulaire.getAll("modules").map(lireTexte),
    motDePasse: lireTexte(formulaire.get("motDePasse")),
    confirmation: lireTexte(formulaire.get("confirmation")),
  };
}

export function validerCreationUtilisateur(formulaire: FormData): ResultatValidation<DonneesCreationUtilisateur> {
  const analyse = schemaCreation.safeParse({ ...lireCommuns(formulaire), identifiant: lireTexte(formulaire.get("identifiant")) });
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}

export function validerModificationUtilisateur(formulaire: FormData): ResultatValidation<DonneesModificationUtilisateur> {
  const analyse = schemaModification.safeParse({
    ...lireCommuns(formulaire),
    id: lireTexte(formulaire.get("id")),
    estActif: formulaire.get("estActif") === "oui",
  });
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}
