import { z } from "zod";
import {
  ETATS_POINTAGE,
  FUSEAU_HORAIRE,
  LIMITE_EMPLOYES_POINTAGE,
  LONGUEUR_MAX_REMARQUE_POINTAGE,
  LONGUEUR_MAX_RECHERCHE,
} from "@/lib/constantes";
import { estDansLeFutur, heureLocaleVersUtc } from "@/lib/metier/pointages";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import { lireTexte, premieresErreurs, texteFacultatif } from "./commun";

const { erreurs } = TEXTES_EXCEPTIONS.pointages;

export type EtatPointage = (typeof ETATS_POINTAGE)[number];

export type DonneesPointages = {
  employeIds: string[];
  horodatage: Date;
  etat: EtatPointage;
  remarque: string | null;
};

const schema = z.object({
  employeIds: z
    .array(z.uuid({ error: erreurs.employeIntrouvable }))
    .min(1, { error: erreurs.employesVides })
    .max(LIMITE_EMPLOYES_POINTAGE, { error: erreurs.tropDEmployes(LIMITE_EMPLOYES_POINTAGE) })
    // Un employé coché deux fois (formulaire modifié) ne compte qu'une fois.
    .transform((ids) => [...new Set(ids)]),
  jour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: erreurs.jourInvalide }),
  heure: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: erreurs.heureInvalide }),
  etat: z.enum(ETATS_POINTAGE, { error: erreurs.etatInvalide }),
  remarque: texteFacultatif.pipe(
    z.string().max(LONGUEUR_MAX_REMARQUE_POINTAGE, { error: erreurs.remarqueTropLongue(LONGUEUR_MAX_REMARQUE_POINTAGE) }).nullable(),
  ),
});

type Validation = { ok: true; donnees: DonneesPointages } | { ok: false; erreursChamps: Record<string, string> };

/** Valide la saisie d'un pointage manuel : employés, date et heure locales (jamais dans le futur), état, remarque. */
export function validerPointages(formulaire: FormData, maintenant: Date): Validation {
  const analyse = schema.safeParse({
    employeIds: formulaire.getAll("employes").map(lireTexte),
    jour: lireTexte(formulaire.get("jour")),
    heure: lireTexte(formulaire.get("heure")),
    etat: lireTexte(formulaire.get("etat")),
    remarque: lireTexte(formulaire.get("remarque")),
  });
  if (!analyse.success) return { ok: false, erreursChamps: premieresErreurs(analyse.error) };

  const { employeIds, jour, heure, etat, remarque } = analyse.data;
  const horodatage = heureLocaleVersUtc(jour, heure, FUSEAU_HORAIRE);
  if (!horodatage) return { ok: false, erreursChamps: { jour: erreurs.jourInvalide } };
  if (estDansLeFutur(horodatage, maintenant)) return { ok: false, erreursChamps: { heure: erreurs.futur } };
  return { ok: true, donnees: { employeIds, horodatage, etat, remarque } };
}

/** Critères de la liste des pointages, lus dans l'URL (une valeur invalide est ignorée). */
export type RecherchePointages = { employe: string; jour: string | null };

const schemaRecherche = z.object({
  employe: z.string().trim().max(LONGUEUR_MAX_RECHERCHE).catch(""),
  jour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().catch(null),
});

export function lireRecherchePointages(parametres: Record<string, string | string[] | undefined>): RecherchePointages {
  const brut = (cle: string) => (typeof parametres[cle] === "string" ? parametres[cle] : undefined);
  return schemaRecherche.parse({ employe: brut("employe") ?? "", jour: brut("jour") || null });
}
