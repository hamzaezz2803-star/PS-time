import { z } from "zod";
import {
  GENRES,
  LONGUEUR_MAX_EMAIL,
  LONGUEUR_MAX_MATRICULE,
  LONGUEUR_MAX_NOM_EMPLOYE,
  LONGUEUR_MAX_NUMERO_BADGE,
  LONGUEUR_MAX_NUMERO_PIECE,
  TYPES_EMPLOI,
  TYPES_PIECE_IDENTITE,
} from "@/lib/constantes";
import { datesEmploiCoherentes, estDateValide, normaliserTelephone } from "@/lib/metier/employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { siteFacultatif } from "./site";

const { erreurs } = TEXTES_PERSONNES;

/** Espaces multiples réduits et bords retirés. */
const texteNettoye = z.string().transform((valeur) => valeur.replace(/\s+/g, " ").trim());
/** Champ facultatif : une saisie vide devient null. */
const facultatif = texteNettoye.transform((valeur) => (valeur === "" ? null : valeur));

/** Identifiant court sans espace (matricule, badge) : lettres, chiffres, « . », « - », « _ ». */
const identifiant = (vide: string, tropLong: string, invalide: string, longueurMax: number) =>
  z
    .string()
    .trim()
    .min(1, { error: vide })
    .max(longueurMax, { error: tropLong })
    .regex(/^[\p{L}\p{N}._-]+$/u, { error: invalide });

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
    matricule: identifiant(erreurs.matriculeVide, erreurs.matriculeTropLong, erreurs.matriculeInvalide, LONGUEUR_MAX_MATRICULE),
    numeroBadge: identifiant(erreurs.badgeVide, erreurs.badgeTropLong, erreurs.badgeInvalide, LONGUEUR_MAX_NUMERO_BADGE),
    prenom: nomPersonne(erreurs.prenomVide),
    nom: nomPersonne(erreurs.nomVide),
    departementId: z.uuid({ error: erreurs.departementVide }),
    posteId: facultatif.pipe(z.uuid({ error: erreurs.posteIntrouvable }).nullable()),
    siteId: siteFacultatif,
    genre: facultatif.pipe(z.enum(GENRES, { error: erreurs.genreInvalide }).nullable()),
    typePieceIdentite: facultatif.pipe(
      z.enum(TYPES_PIECE_IDENTITE, { error: erreurs.typePieceInvalide }).nullable(),
    ),
    // Enregistré en majuscules et sans espace : « ab 12345 » donne « AB12345 ».
    numeroPieceIdentite: facultatif.pipe(
      z
        .string()
        .transform((valeur) => valeur.replace(/\s+/g, "").toUpperCase())
        .pipe(
          z
            .string()
            .max(LONGUEUR_MAX_NUMERO_PIECE, { error: erreurs.numeroPieceTropLong })
            .regex(/^[\p{L}\p{N}-]+$/u, { error: erreurs.numeroPieceInvalide }),
        )
        .nullable(),
    ),
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
    dateDebutEmploi: dateFacultative,
    dateFinEmploi: dateFacultative,
  })
  .refine((employe) => (employe.typePieceIdentite === null) === (employe.numeroPieceIdentite === null), {
    error: erreurs.pieceIncomplete,
    path: ["numeroPieceIdentite"],
  })
  .refine((employe) => datesEmploiCoherentes(employe.dateEmbauche, employe.dateFinEmploi), {
    error: erreurs.datesIncoherentes,
    path: ["dateFinEmploi"],
  })
  .refine((employe) => datesEmploiCoherentes(employe.dateDebutEmploi, employe.dateFinEmploi), {
    error: erreurs.debutApresFin,
    path: ["dateFinEmploi"],
  });

export type DonneesEmploye = z.infer<typeof schemaEmploye>;
type ChampEmploye = keyof DonneesEmploye;

export const CHAMPS_EMPLOYE = [
  "matricule",
  "numeroBadge",
  "prenom",
  "nom",
  "departementId",
  "posteId",
  "siteId",
  "genre",
  "typePieceIdentite",
  "numeroPieceIdentite",
  "telephone",
  "email",
  "typeEmploi",
  "dateEmbauche",
  "dateDebutEmploi",
  "dateFinEmploi",
] as const satisfies readonly ChampEmploye[];

export const lireTexte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");

type ResultatValidation =
  | { ok: true; donnees: DonneesEmploye }
  | { ok: false; erreursChamps: Partial<Record<ChampEmploye, string>> };

/** Valide les informations d'un employé (les informations supplémentaires sont validées à part). */
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
