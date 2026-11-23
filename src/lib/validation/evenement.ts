import { z } from "zod";
import { LONGUEUR_MAX_NOM_EVENEMENT, PRIORITE_EVENEMENT_MAX, TYPES_EVENEMENT, UNITES_SAISIE_EVENEMENT } from "@/lib/constantes";
import { heuresEnMinutes } from "@/lib/metier/evenements";
import { TEXTES_EVENEMENTS } from "@/lib/textes/evenements";
import type { Evenement, Resultat } from "@/types";
import { entierBorne, lireTexte, nomObligatoire, premieresErreurs } from "./commun";

const { erreurs } = TEXTES_EVENEMENTS;

const schemaEvenement = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,3}$/, { error: erreurs.codeInvalide }),
  nom: nomObligatoire(LONGUEUR_MAX_NOM_EVENEMENT, erreurs.nomVide, TEXTES_EVENEMENTS.nomTropLong),
  type: z.enum(TYPES_EVENEMENT, { error: erreurs.typeInvalide }),
  uniteSaisie: z.enum(UNITES_SAISIE_EVENEMENT, { error: erreurs.uniteInvalide }),
  estPrioritaireSurPointages: z.boolean(),
  estSoumisDroits: z.boolean(),
  estVisiblePlanning: z.boolean(),
  priorite: entierBorne(0, PRIORITE_EVENEMENT_MAX, erreurs.prioriteInvalide),
  codePaie: z
    .string()
    .trim()
    .transform((valeur) => (valeur === "" ? null : valeur))
    .pipe(z.string().regex(/^[A-Za-z0-9_-]{1,20}$/, { error: erreurs.codePaieInvalide }).nullable()),
});

export type DonneesEvenement = Omit<Evenement, "id">;
type ResultatValidation = Resultat<DonneesEvenement> & { erreursChamps?: Record<string, string> };

/** Valide le formulaire d'un événement ; le nombre d'heures n'est lu que pour un événement en heures. */
export function validerEvenement(formulaire: FormData): ResultatValidation {
  const analyse = schemaEvenement.safeParse({
    code: lireTexte(formulaire.get("code")),
    nom: lireTexte(formulaire.get("nom")),
    type: lireTexte(formulaire.get("type")),
    uniteSaisie: lireTexte(formulaire.get("uniteSaisie")),
    estPrioritaireSurPointages: formulaire.get("estPrioritaireSurPointages") === "oui",
    estSoumisDroits: formulaire.get("estSoumisDroits") === "oui",
    estVisiblePlanning: formulaire.get("estVisiblePlanning") === "oui",
    priorite: lireTexte(formulaire.get("priorite")),
    codePaie: lireTexte(formulaire.get("codePaie")),
  });
  const enHeures = analyse.success && analyse.data.uniteSaisie === "heures";
  const dureeMinutes = enHeures ? heuresEnMinutes(lireTexte(formulaire.get("dureeHeures"))) : null;
  const dureeManquante = enHeures && dureeMinutes === null;
  if (!analyse.success || dureeManquante) {
    const erreursChamps = analyse.success ? {} : premieresErreurs(analyse.error);
    return { ok: false, erreur: "validation", erreursChamps: dureeManquante ? { ...erreursChamps, dureeHeures: erreurs.dureeInvalide } : erreursChamps };
  }
  return { ok: true, donnees: { ...analyse.data, dureeMinutes } };
}
