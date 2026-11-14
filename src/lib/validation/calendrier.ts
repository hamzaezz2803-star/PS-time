import { z } from "zod";
import {
  FENETRE_POINTAGE_MAX_MINUTES,
  HEURES_SUP_MAX_MINUTES,
  LONGUEUR_MAX_NOM_PROGRAMME,
  TOLERANCE_MAX_MINUTES,
} from "@/lib/constantes";
import { heureVersMinutes, pauseDansService } from "@/lib/metier/programme";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Calendrier, Resultat } from "@/types";
import { caseCochee, entierBorne, lireChamps, nomObligatoire, premieresErreurs } from "./commun";

const textes = TEXTES_PROGRAMME.calendriers;
const minutes = (maximum: number) => entierBorne(0, maximum, textes.nombreInvalide(0, maximum));
const heure = z.string().transform((valeur, contexte) => {
  const resultat = heureVersMinutes(valeur);
  if (resultat === null) contexte.addIssue({ code: "custom", message: textes.erreurs.heureInvalide });
  return resultat ?? 0;
});
/** Heure facultative : une saisie vide donne null. */
const heureFacultative = z.union([z.literal("").transform(() => null), heure]);

const schemaCalendrier = z
  .object({
    nom: nomObligatoire(LONGUEUR_MAX_NOM_PROGRAMME, textes.nomVide, textes.nomTropLong),
    debutMinutes: heure,
    finMinutes: heure,
    pauseDebutMinutes: heureFacultative,
    pauseFinMinutes: heureFacultative,
    entreeAvantMinutes: minutes(FENETRE_POINTAGE_MAX_MINUTES),
    entreeApresMinutes: minutes(FENETRE_POINTAGE_MAX_MINUTES),
    sortieAvantMinutes: minutes(FENETRE_POINTAGE_MAX_MINUTES),
    sortieApresMinutes: minutes(FENETRE_POINTAGE_MAX_MINUTES),
    retardTolereMinutes: minutes(TOLERANCE_MAX_MINUTES),
    departAnticipeTolereMinutes: minutes(TOLERANCE_MAX_MINUTES),
    pointageEntreeObligatoire: caseCochee,
    pointageSortieObligatoire: caseCochee,
    heuresSupActives: caseCochee,
    heuresSupApresMinutes: minutes(FENETRE_POINTAGE_MAX_MINUTES),
    heuresSupMinimumMinutes: minutes(FENETRE_POINTAGE_MAX_MINUTES),
    heuresSupMaximumMinutes: minutes(HEURES_SUP_MAX_MINUTES),
  })
  .refine((c) => c.debutMinutes !== c.finMinutes, { error: textes.erreurs.heuresIdentiques, path: ["finMinutes"] })
  .refine((c) => (c.pauseDebutMinutes === null) === (c.pauseFinMinutes === null), {
    error: textes.erreurs.pauseIncomplete,
    path: ["pauseFinMinutes"],
  })
  .refine(
    (c) =>
      c.pauseDebutMinutes === null ||
      c.pauseFinMinutes === null ||
      pauseDansService(c.debutMinutes, c.finMinutes, c.pauseDebutMinutes, c.pauseFinMinutes),
    { error: textes.erreurs.pauseHorsService, path: ["pauseDebutMinutes"] },
  );

export type DonneesCalendrier = Omit<Calendrier, "id">;
export const CHAMPS_CALENDRIER = Object.keys(schemaCalendrier.shape) as (keyof DonneesCalendrier)[];

/** Valide le formulaire d'un calendrier. */
export function validerCalendrier(
  formulaire: FormData,
): Resultat<DonneesCalendrier> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaCalendrier.safeParse(lireChamps(formulaire, CHAMPS_CALENDRIER));
  if (analyse.success) return { ok: true, donnees: analyse.data };
  return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
}
