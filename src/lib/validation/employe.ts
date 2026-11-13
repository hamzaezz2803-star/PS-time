import { z } from "zod";
import {
  LONGUEUR_MAX_EMAIL,
  LONGUEUR_MAX_MATRICULE,
  LONGUEUR_MAX_NOM_EMPLOYE,
  LONGUEUR_MAX_NOM_CHAMP,
  TYPES_CHAMP_PERSONNALISE,
  TYPES_EMPLOI,
} from "@/lib/constantes";
import { datesEmploiCoherentes, estDateValide, normaliserTelephone } from "@/lib/metier/employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

const { erreurs } = TEXTES_PERSONNES;

/** Espaces multiples réduits et bords retirés. */
const texteNettoye = z.string().transform((valeur) => valeur.replace(/\s+/g, " ").trim());
/** Champ facultatif : une saisie vide devient null. */
const facultatif = texteNettoye.transform((valeur) => (valeur === "" ? null : valeur));

const nomPersonne = (erreurVide: string) =>
  texteNettoye.pipe(
    z
      .string()
      .min(1, { error: erreurVide })
      .max(LONGUEUR_MAX_NOM_EMPLOYE, { error: erreurs.nomTropLong }),
  );

const dateFacultative = facultatif.refine((valeur) => valeur === null || estDateValide(valeur), {
  error: erreurs.dateInvalide,
});

const schemaEmploye = z
  .object({
    matricule: z
      .string()
      .trim()
      .min(1, { error: erreurs.matriculeVide })
      .max(LONGUEUR_MAX_MATRICULE, { error: erreurs.matriculeTropLong })
      .regex(/^[\p{L}\p{N}._-]+$/u, { error: erreurs.matriculeInvalide }),
    prenom: nomPersonne(erreurs.prenomVide),
    nom: nomPersonne(erreurs.nomVide),
    departementId: z.uuid({ error: erreurs.departementVide }),
    posteId: facultatif.pipe(z.uuid({ error: erreurs.posteIntrouvable }).nullable()),
    telephone: facultatif.transform((valeur, contexte) => {
      if (valeur === null) return null;
      const numero = normaliserTelephone(valeur);
      if (numero === null) contexte.addIssue({ code: "custom", message: erreurs.telephoneInvalide });
      return numero;
    }),
    email: facultatif.pipe(
      z
        .email({ error: erreurs.emailInvalide })
        .max(LONGUEUR_MAX_EMAIL, { error: erreurs.emailInvalide })
        .transform((valeur) => valeur.toLowerCase())
        .nullable(),
    ),
    typeEmploi: facultatif.pipe(z.enum(TYPES_EMPLOI, { error: erreurs.typeEmploiInvalide }).nullable()),
    dateEmbauche: dateFacultative,
    dateFinEmploi: dateFacultative,
  })
  .refine((employe) => datesEmploiCoherentes(employe.dateEmbauche, employe.dateFinEmploi), {
    error: erreurs.datesIncoherentes,
    path: ["dateFinEmploi"],
  });

export type DonneesEmploye = z.infer<typeof schemaEmploye>;
type ChampEmploye = keyof DonneesEmploye;

export const CHAMPS_EMPLOYE = [
  "matricule",
  "prenom",
  "nom",
  "departementId",
  "posteId",
  "telephone",
  "email",
  "typeEmploi",
  "dateEmbauche",
  "dateFinEmploi",
] as const satisfies readonly ChampEmploye[];

export const lireTexte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");

type ResultatValidation =
  | { ok: true; donnees: DonneesEmploye }
  | { ok: false; erreursChamps: Partial<Record<ChampEmploye, string>> };

/** Valide les informations principales d'un employé (les champs facultatifs sont validés à part). */
export function validerEmploye(formulaire: FormData): ResultatValidation {
  const saisie = Object.fromEntries(
    CHAMPS_EMPLOYE.map((champ) => [champ, lireTexte(formulaire.get(champ))]),
  );
  const analyse = schemaEmploye.safeParse(saisie);
  if (analyse.success) return { ok: true, donnees: analyse.data };

  const { fieldErrors } = z.flattenError(analyse.error);
  const erreursChamps: Partial<Record<ChampEmploye, string>> = {};
  for (const champ of CHAMPS_EMPLOYE) erreursChamps[champ] = fieldErrors[champ]?.[0];
  return { ok: false, erreursChamps };
}

const schemaNouveauChamp = z.object({
  nom: texteNettoye.pipe(
    z
      .string()
      .min(1, { error: erreurs.nomChampVide })
      .max(LONGUEUR_MAX_NOM_CHAMP, { error: erreurs.nomChampTropLong }),
  ),
  type: z.enum(TYPES_CHAMP_PERSONNALISE, { error: erreurs.typeChampInvalide }),
});

export type DonneesNouveauChamp = z.infer<typeof schemaNouveauChamp>;

/** Valide la création d'un champ facultatif. Renvoie le premier message d'erreur sinon. */
export function validerNouveauChamp(
  saisie: unknown,
): { ok: true; donnees: DonneesNouveauChamp } | { ok: false; erreur: string } {
  const analyse = schemaNouveauChamp.safeParse(saisie);
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: analyse.error.issues[0]?.message ?? erreurs.echec };
}
