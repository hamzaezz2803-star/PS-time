import { z } from "zod";
import { POLICES, THEMES } from "@/lib/constantes";
import type { Apparence } from "@/lib/metier/apparence";
import { TEXTES_APPARENCE } from "@/lib/textes/apparence";
import type { Resultat } from "@/types";
import { lireTexte, premieresErreurs } from "./commun";

const schemaApparence = z.object({
  theme: z.enum(THEMES, { error: TEXTES_APPARENCE.erreurs.theme }),
  police: z.enum(POLICES, { error: TEXTES_APPARENCE.erreurs.police }),
});

/** Thème et police envoyés par le formulaire : seules les valeurs connues de l'application sont acceptées. */
export function validerApparence(formulaire: FormData): Resultat<Apparence> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaApparence.safeParse({
    theme: lireTexte(formulaire.get("theme")),
    police: lireTexte(formulaire.get("police")),
  });
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}
