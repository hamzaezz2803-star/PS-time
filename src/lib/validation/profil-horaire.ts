import { z } from "zod";
import { LONGUEUR_MAX_NOM_PROGRAMME, PLAGES_PAR_PROFIL_MAX, REPAS_MAX_MINUTES, TYPES_PROFIL } from "@/lib/constantes";
import { MINUTES_PAR_JOUR } from "@/lib/metier/programme";
import { TYPES_PLAGE, verifierPlages, type Plage } from "@/lib/metier/profil-horaire";
import { TEXTES_PROFILS } from "@/lib/textes/profils-horaires";
import type { ProfilHoraire, Resultat } from "@/types";
import { lireTexte, nomObligatoire, premieresErreurs } from "./commun";

const { erreurs } = TEXTES_PROFILS;

/** « 08:30 » donne 510 ; « 24:00 » donne 1440 (fin de journée). Invalide : null. */
export function heureDePlage(saisie: string): number | null {
  const correspondance = /^(\d{1,2}):(\d{2})$/.exec(saisie.trim());
  if (!correspondance) return null;
  const minutes = Number(correspondance[1]) * 60 + Number(correspondance[2]);
  return Number(correspondance[2]) < 60 && minutes <= MINUTES_PAR_JOUR ? minutes : null;
}

const repas = z
  .string()
  .trim()
  .transform((valeur) => (valeur === "" ? null : valeur))
  .pipe(
    z
      .string()
      .regex(/^\d+$/, { error: erreurs.repasInvalide(REPAS_MAX_MINUTES) })
      .transform(Number)
      .pipe(z.int().max(REPAS_MAX_MINUTES, { error: erreurs.repasInvalide(REPAS_MAX_MINUTES) }))
      .nullable(),
  );

const schemaProfil = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,3}$/, { error: erreurs.codeInvalide }),
    nom: nomObligatoire(LONGUEUR_MAX_NOM_PROGRAMME, TEXTES_PROFILS.nomVide, TEXTES_PROFILS.nomTropLong),
    type: z.enum(TYPES_PROFIL, { error: erreurs.typeInvalide }),
    estBadge: z.boolean(),
    repasMinimumMinutes: repas,
    repasMaximumMinutes: repas,
  })
  .refine(
    (profil) => profil.repasMinimumMinutes === null || profil.repasMaximumMinutes === null || profil.repasMinimumMinutes <= profil.repasMaximumMinutes,
    { path: ["repasMaximumMinutes"], error: erreurs.repasIncoherent },
  );

export type DonneesProfil = Omit<ProfilHoraire, "id">;
type ResultatValidation = Resultat<DonneesProfil> & { erreursChamps?: Record<string, string> };

/**
 * Plages envoyées par le formulaire : une fin et un type par ligne (« plageFin », « plageType »),
 * le début de chaque plage étant la fin de la précédente (00:00 pour la première).
 */
function lirePlages(formulaire: FormData): { ok: true; plages: Plage[] } | { ok: false; erreur: string } {
  const fins = formulaire.getAll("plageFin").map(lireTexte);
  const types = formulaire.getAll("plageType").map(lireTexte);
  if (fins.length > PLAGES_PAR_PROFIL_MAX) return { ok: false, erreur: erreurs.tropDePlages(PLAGES_PAR_PROFIL_MAX) };
  const plages: Plage[] = [];
  let debut = 0;
  for (const [rang, saisie] of fins.entries()) {
    const fin = heureDePlage(saisie);
    const type = TYPES_PLAGE.find((valeur) => valeur === types[rang]);
    if (fin === null) return { ok: false, erreur: erreurs.heureInvalide };
    if (!type) return { ok: false, erreur: erreurs.typePlageInvalide };
    plages.push({ debut, fin, type });
    debut = fin;
  }
  const probleme = verifierPlages(plages);
  return probleme ? { ok: false, erreur: erreurs.plages[probleme] } : { ok: true, plages };
}

/** Valide le formulaire d'un profil. Un profil « repos » n'a pas de plages. */
export function validerProfil(formulaire: FormData): ResultatValidation {
  const analyse = schemaProfil.safeParse({
    code: lireTexte(formulaire.get("code")),
    nom: lireTexte(formulaire.get("nom")),
    type: lireTexte(formulaire.get("type")),
    estBadge: formulaire.get("estBadge") === "oui",
    repasMinimumMinutes: lireTexte(formulaire.get("repasMinimumMinutes")),
    repasMaximumMinutes: lireTexte(formulaire.get("repasMaximumMinutes")),
  });
  if (!analyse.success) return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
  if (analyse.data.type === "repos") {
    return { ok: true, donnees: { ...analyse.data, estBadge: false, repasMinimumMinutes: null, repasMaximumMinutes: null, plages: [] } };
  }
  const plages = lirePlages(formulaire);
  if (!plages.ok) return { ok: false, erreur: "validation", erreursChamps: { plages: plages.erreur } };
  return { ok: true, donnees: { ...analyse.data, plages: plages.plages } };
}
