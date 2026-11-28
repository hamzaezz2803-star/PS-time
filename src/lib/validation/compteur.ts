import { z } from "zod";
import { FORMULE_LONGUEUR_MAX, LONGUEUR_MAX_DESCRIPTION_COMPTEUR, LONGUEUR_MAX_LIBELLE_COMPTEUR } from "@/lib/constantes";
import { UNITES_COMPTEUR, type UniteCompteur } from "@/lib/metier/compteurs/format";
import { PERIODICITES, type Periodicite } from "@/lib/metier/compteurs/periodes";
import { variablesPour } from "@/lib/metier/compteurs/variables";
import { AUCUN_CODE, type CodesCompteurs } from "@/lib/metier/compteurs/variables-evenements";
import { compilerFormule } from "@/lib/metier/formules/formule";
import { messageErreurFormule } from "@/lib/textes/formules";
import { TEXTES_COMPTEURS } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES } from "@/lib/textes/variables-compteurs";
import type { Resultat } from "@/types";
import { lireTexte, nomObligatoire, premieresErreurs, texteFacultatif } from "./commun";

const { erreurs } = TEXTES_COMPTEURS;

export const FORMAT_CODE_COMPTEUR = /^[A-Z0-9][A-Z0-9_-]{0,29}$/;

const schemaCompteur = z.object({
  code: z.string().trim().toUpperCase().regex(FORMAT_CODE_COMPTEUR, { error: erreurs.codeInvalide }),
  libelle: nomObligatoire(LONGUEUR_MAX_LIBELLE_COMPTEUR, erreurs.libelleVide, erreurs.libelleTropLong),
  periodicites: z.array(z.enum(PERIODICITES)).min(1, { error: erreurs.periodicitesVides }),
  unite: z.enum(UNITES_COMPTEUR, { error: erreurs.uniteInvalide }),
  description: texteFacultatif.pipe(z.string().max(LONGUEUR_MAX_DESCRIPTION_COMPTEUR, { error: erreurs.descriptionTropLongue }).nullable()),
  formule: z.string().max(FORMULE_LONGUEUR_MAX),
  estActif: z.boolean(),
});

export type DonneesCompteur = {
  code: string;
  libelle: string;
  periodicites: Periodicite[];
  unite: UniteCompteur;
  description: string | null;
  formule: string;
  estActif: boolean;
};

/**
 * Première erreur de la formule pour les périodicités choisies (une variable peut exister pour
 * le mois mais pas pour le jour), ou null si elle est valide partout.
 */
export function erreurFormule(formule: string, periodicites: readonly Periodicite[], codes: CodesCompteurs = AUCUN_CODE): string | null {
  for (const periodicite of periodicites) {
    const resultat = compilerFormule(formule, variablesPour(periodicite, codes));
    if (!resultat.ok) {
      const message = messageErreurFormule(resultat.erreur);
      return periodicites.length > 1 ? TEXTES_COMPTEURS.erreurPour(TEXTES_PERIODICITES[periodicite], message) : message;
    }
  }
  return null;
}

/**
 * Valide le formulaire d'un compteur, formule comprise (vérifiée pour chaque périodicité cochée,
 * avec les variables des événements de l'installation).
 */
export function validerCompteur(formulaire: FormData, codes: CodesCompteurs): Resultat<DonneesCompteur> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaCompteur.safeParse({
    code: lireTexte(formulaire.get("code")),
    libelle: lireTexte(formulaire.get("libelle")),
    periodicites: [...new Set(formulaire.getAll("periodicites").map(lireTexte))],
    unite: lireTexte(formulaire.get("unite")),
    description: lireTexte(formulaire.get("description")),
    formule: lireTexte(formulaire.get("formule")),
    estActif: formulaire.get("estActif") === "oui",
  });
  if (!analyse.success) return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };

  const donnees = { ...analyse.data, formule: analyse.data.formule.trim() };
  // Toujours dans l'ordre jour, semaine, mois.
  donnees.periodicites = PERIODICITES.filter((periodicite) => donnees.periodicites.includes(periodicite));
  const erreur = erreurFormule(donnees.formule, donnees.periodicites, codes);
  if (erreur) return { ok: false, erreur: "validation", erreursChamps: { formule: erreur } };
  return { ok: true, donnees };
}
