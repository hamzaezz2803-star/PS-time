import { z } from "zod";
import { LONGUEUR_MAX_NOM_EVENEMENT, PERIODES_PRISE_MAX, PRIORITE_EVENEMENT_MAX, TYPES_EVENEMENT } from "@/lib/constantes";
import { trierPeriodes, verifierPeriodesPrise, type PeriodePrise } from "@/lib/metier/evenements";
import { TEXTES_EVENEMENTS } from "@/lib/textes/evenements";
import type { Evenement, Resultat } from "@/types";
import { entierBorne, lireTexte, nomObligatoire, premieresErreurs } from "./commun";

const { erreurs } = TEXTES_EVENEMENTS;
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Jour du calendrier AAAA-MM-JJ réellement existant (refuse le 31 février). */
const estJourValide = (jour: string) => FORMAT_JOUR.test(jour) && new Date(`${jour}T00:00:00Z`).toISOString().startsWith(jour);

const schemaEvenement = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,3}$/, { error: erreurs.codeInvalide }),
  nom: nomObligatoire(LONGUEUR_MAX_NOM_EVENEMENT, erreurs.nomVide, TEXTES_EVENEMENTS.nomTropLong),
  type: z.enum(TYPES_EVENEMENT, { error: erreurs.typeInvalide }),
  estSaisiEnHeures: z.boolean(),
  estPrioritaireSurPointages: z.boolean(),
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

/**
 * Périodes envoyées par le formulaire : une date de début et une date de fin par ligne
 * (« periodeDebut », « periodeFin »). Une ligne entièrement vide est ignorée.
 */
function lirePeriodes(formulaire: FormData): { ok: true; periodes: PeriodePrise[] } | { ok: false; erreur: string } {
  const debuts = formulaire.getAll("periodeDebut").map(lireTexte);
  const fins = formulaire.getAll("periodeFin").map(lireTexte);
  if (debuts.length > PERIODES_PRISE_MAX || fins.length > PERIODES_PRISE_MAX) return { ok: false, erreur: erreurs.periodes.trop };
  const periodes: PeriodePrise[] = [];
  for (const [rang, debut] of debuts.entries()) {
    const fin = fins[rang] ?? "";
    if (debut === "" && fin === "") continue;
    if (debut === "" || fin === "") return { ok: false, erreur: erreurs.periodes.incomplete };
    if (!estJourValide(debut) || !estJourValide(fin)) return { ok: false, erreur: erreurs.dateInvalide };
    periodes.push({ debut, fin });
  }
  const probleme = verifierPeriodesPrise(periodes);
  return probleme ? { ok: false, erreur: erreurs.periodes[probleme] } : { ok: true, periodes: trierPeriodes(periodes) };
}

/** Valide le formulaire d'un événement, périodes de prise comprises. */
export function validerEvenement(formulaire: FormData): ResultatValidation {
  const analyse = schemaEvenement.safeParse({
    code: lireTexte(formulaire.get("code")),
    nom: lireTexte(formulaire.get("nom")),
    type: lireTexte(formulaire.get("type")),
    estSaisiEnHeures: formulaire.get("estSaisiEnHeures") === "oui",
    estPrioritaireSurPointages: formulaire.get("estPrioritaireSurPointages") === "oui",
    estVisiblePlanning: formulaire.get("estVisiblePlanning") === "oui",
    priorite: lireTexte(formulaire.get("priorite")),
    codePaie: lireTexte(formulaire.get("codePaie")),
  });
  const periodes = lirePeriodes(formulaire);
  if (!analyse.success || !periodes.ok) {
    const erreursChamps = analyse.success ? {} : premieresErreurs(analyse.error);
    return { ok: false, erreur: "validation", erreursChamps: periodes.ok ? erreursChamps : { ...erreursChamps, periodes: periodes.erreur } };
  }
  return { ok: true, donnees: { ...analyse.data, periodes: periodes.periodes } };
}
