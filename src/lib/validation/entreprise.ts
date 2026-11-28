import { z } from "zod";
import {
  LONGUEUR_ICE,
  LONGUEUR_MAX_ADRESSE_ENTREPRISE,
  LONGUEUR_MAX_EMAIL,
  LONGUEUR_MAX_IDENTIFIANT_FISCAL,
  LONGUEUR_MAX_NOM_ENTREPRISE,
  LONGUEUR_MAX_NUMERO_CNSS,
  LONGUEUR_MAX_RC,
} from "@/lib/constantes";
import { normaliserTelephone } from "@/lib/metier/employes";
import { TEXTES_ENTREPRISE } from "@/lib/textes/entreprise";
import type { Resultat } from "@/types";
import { lireChamps, nomObligatoire, premieresErreurs, texteFacultatif } from "./commun";

const { erreurs } = TEXTES_ENTREPRISE;

/** Champs texte du formulaire, sous leurs noms d'envoi. */
export const CHAMPS_ENTREPRISE = ["nom", "adresse", "telephone", "email", "ice", "registreCommerce", "identifiantFiscal", "numeroCnss"] as const;
export type ChampEntreprise = (typeof CHAMPS_ENTREPRISE)[number];

/** Suite de chiffres saisie avec ou sans espaces (« 001 234 567 000 089 »), enregistrée sans espace. */
const chiffres = (longueurMin: number, longueurMax: number, erreur: string) =>
  texteFacultatif.pipe(
    z
      .string()
      .transform((valeur) => valeur.replace(/\s+/g, ""))
      .pipe(z.string().regex(new RegExp(`^\\d{${longueurMin},${longueurMax}}$`), { error: erreur }))
      .nullable(),
  );

const schemaEntreprise = z.object({
  nom: nomObligatoire(LONGUEUR_MAX_NOM_ENTREPRISE, erreurs.nomVide, erreurs.nomTropLong),
  adresse: texteFacultatif.pipe(z.string().max(LONGUEUR_MAX_ADRESSE_ENTREPRISE, { error: erreurs.adresseTropLongue }).nullable()),
  telephone: texteFacultatif.transform((valeur, contexte) => {
    if (valeur === null) return null;
    const numero = normaliserTelephone(valeur);
    if (numero === null) contexte.addIssue({ code: "custom", message: erreurs.telephoneInvalide });
    return numero;
  }),
  email: texteFacultatif.pipe(
    z
      .email({ error: erreurs.emailInvalide })
      .max(LONGUEUR_MAX_EMAIL, { error: erreurs.emailInvalide })
      .transform((valeur) => valeur.toLowerCase())
      .nullable(),
  ),
  ice: chiffres(LONGUEUR_ICE, LONGUEUR_ICE, erreurs.iceInvalide),
  registreCommerce: texteFacultatif.pipe(z.string().max(LONGUEUR_MAX_RC, { error: erreurs.registreCommerceTropLong }).nullable()),
  identifiantFiscal: chiffres(1, LONGUEUR_MAX_IDENTIFIANT_FISCAL, erreurs.identifiantFiscalInvalide),
  numeroCnss: chiffres(1, LONGUEUR_MAX_NUMERO_CNSS, erreurs.numeroCnssInvalide),
});

export type DonneesEntreprise = z.infer<typeof schemaEntreprise>;

/** Informations envoyées par le formulaire : nom obligatoire, le reste facultatif et vérifié. */
export function validerEntreprise(formulaire: FormData): Resultat<DonneesEntreprise> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaEntreprise.safeParse(lireChamps(formulaire, CHAMPS_ENTREPRISE));
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}
