import { z } from "zod";
import { COULEURS_PERSONNALISABLES, CONTRASTE_MIN_TEXTE, POLICES, TAILLES_TEXTE, THEMES } from "@/lib/constantes";
import { cleCouleur, type Apparence } from "@/lib/metier/apparence";
import { FORMAT_COULEUR, controlerContrastes } from "@/lib/metier/couleurs";
import { TEXTES_APPARENCE } from "@/lib/textes/apparence";
import type { Resultat } from "@/types";
import { lireTexte, premieresErreurs } from "./commun";

const { erreurs } = TEXTES_APPARENCE;
const couleur = z.string().trim().toLowerCase().regex(FORMAT_COULEUR, { error: erreurs.couleur });

const schemaApparence = z
  .object({
    theme: z.enum(THEMES, { error: erreurs.theme }),
    police: z.enum(POLICES, { error: erreurs.police }),
    taille: z.enum(TAILLES_TEXTE, { error: erreurs.taille }),
    couleurs: z.object({ primaire: couleur, marine: couleur, accent: couleur, fond: couleur }),
  })
  .superRefine((apparence, contexte) => {
    // Seul le thème personnalisé utilise ces couleurs : elles doivent alors rester lisibles.
    if (apparence.theme !== "personnalise") return;
    for (const controle of controlerContrastes(apparence.couleurs)) {
      if (!controle.estLisible) {
        contexte.addIssue({
          code: "custom",
          path: [cleCouleur(controle.couleur)],
          message: erreurs.contraste(controle.couleur, controle.ratio, CONTRASTE_MIN_TEXTE),
        });
      }
    }
  });

/** Apparence envoyée par le formulaire : valeurs connues seulement, couleurs `#rrggbb` lisibles. */
export function validerApparence(formulaire: FormData): Resultat<Apparence> & { erreursChamps?: Record<string, string> } {
  const couleurs = Object.fromEntries(COULEURS_PERSONNALISABLES.map((nom) => [nom, lireTexte(formulaire.get(cleCouleur(nom)))]));
  const analyse = schemaApparence.safeParse({
    theme: lireTexte(formulaire.get("theme")),
    police: lireTexte(formulaire.get("police")),
    taille: lireTexte(formulaire.get("taille")),
    couleurs,
  });
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}
