import { z } from "zod";
import { DUREE_MAX_ABSENCE_JOURS, LIMITE_EMPLOYES_POINTAGE, LONGUEUR_MAX_RECHERCHE, LONGUEUR_MAX_REMARQUE_ABSENCE } from "@/lib/constantes";
import { nombreDeJours, type SaisieEvenement } from "@/lib/metier/evenements";
import { TEXTES_ABSENCES } from "@/lib/textes/absences";
import { lireTexte, premieresErreurs, texteFacultatif } from "./commun";

const { erreurs } = TEXTES_ABSENCES;
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;
const FORMAT_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Jour du calendrier AAAA-MM-JJ réellement existant (refuse le 31 février). */
const jourValide = z
  .string()
  .regex(FORMAT_JOUR, { error: erreurs.dateInvalide })
  .refine((jour) => new Date(`${jour}T00:00:00Z`).toISOString().startsWith(jour), { error: erreurs.dateInvalide });

const enMinutes = (heure: string) => Number(heure.slice(0, 2)) * 60 + Number(heure.slice(3, 5));

const schemaCommun = z.object({
  employeIds: z
    .array(z.uuid({ error: erreurs.employeIntrouvable }))
    .min(1, { error: erreurs.employesVides })
    .max(LIMITE_EMPLOYES_POINTAGE, { error: erreurs.tropDEmployes(LIMITE_EMPLOYES_POINTAGE) })
    .transform((ids) => [...new Set(ids)]),
  evenementId: z.uuid({ error: erreurs.evenementVide }),
  remarque: texteFacultatif.pipe(
    z.string().max(LONGUEUR_MAX_REMARQUE_ABSENCE, { error: erreurs.remarqueTropLongue(LONGUEUR_MAX_REMARQUE_ABSENCE) }).nullable(),
  ),
});

const schemaJournees = z
  .object({ du: jourValide, au: jourValide })
  .refine((saisie) => saisie.au >= saisie.du, { path: ["au"], error: erreurs.datesIncoherentes })
  .refine((saisie) => nombreDeJours({ debut: saisie.du, fin: saisie.au }) <= DUREE_MAX_ABSENCE_JOURS, { path: ["au"], error: erreurs.tropLong(DUREE_MAX_ABSENCE_JOURS) });

const schemaHeures = z
  .object({
    jour: jourValide,
    de: z.string().regex(FORMAT_HEURE, { error: erreurs.heureInvalide }),
    // 24:00 accepté en fin : jusqu'à minuit.
    a: z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, { error: erreurs.heureInvalide }),
  })
  .refine((saisie) => enMinutes(saisie.a) > enMinutes(saisie.de), { path: ["a"], error: erreurs.heuresIncoherentes });

export type DonneesAbsences = { employeIds: string[]; evenementId: string; remarque: string | null; saisie: SaisieEvenement };

type Validation = { ok: true; donnees: DonneesAbsences } | { ok: false; erreursChamps: Record<string, string> };

/** Valide la saisie d'une absence : employés, événement, journées entières (du, au) ou heures sur un jour, remarque. */
export function validerAbsences(formulaire: FormData): Validation {
  const commun = schemaCommun.safeParse({
    employeIds: formulaire.getAll("employes").map(lireTexte),
    evenementId: lireTexte(formulaire.get("evenementId")),
    remarque: lireTexte(formulaire.get("remarque")),
  });
  const enHeures = formulaire.get("duree") === "heures";
  const periode = enHeures
    ? schemaHeures.safeParse({ jour: lireTexte(formulaire.get("jour")), de: lireTexte(formulaire.get("de")), a: lireTexte(formulaire.get("a")) })
    : schemaJournees.safeParse({ du: lireTexte(formulaire.get("du")), au: lireTexte(formulaire.get("au")) });

  if (!commun.success || !periode.success) {
    return {
      ok: false,
      erreursChamps: { ...(commun.success ? {} : premieresErreurs(commun.error)), ...(periode.success ? {} : premieresErreurs(periode.error)) },
    };
  }
  const donnees = periode.data;
  const saisie: SaisieEvenement =
    "jour" in donnees
      ? { debut: donnees.jour, fin: donnees.jour, debutMinutes: enMinutes(donnees.de), finMinutes: enMinutes(donnees.a) }
      : { debut: donnees.du, fin: donnees.au, debutMinutes: null, finMinutes: null };
  return { ok: true, donnees: { ...commun.data, saisie } };
}

/** Critères de la liste, lus dans l'URL (une valeur invalide est ignorée). */
export type RechercheAbsences = { employe: string; jour: string | null };

const schemaRecherche = z.object({
  employe: z.string().trim().max(LONGUEUR_MAX_RECHERCHE).catch(""),
  jour: z.string().regex(FORMAT_JOUR).nullable().catch(null),
});

export function lireRechercheAbsences(parametres: Record<string, string | string[] | undefined>): RechercheAbsences {
  const brut = (cle: string) => (typeof parametres[cle] === "string" ? parametres[cle] : undefined);
  return schemaRecherche.parse({ employe: brut("employe") ?? "", jour: brut("jour") || null });
}
