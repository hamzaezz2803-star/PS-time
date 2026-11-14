import { z } from "zod";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Resultat } from "@/types";
import { lireTexte, premieresErreurs } from "./commun";

const textes = TEXTES_PROGRAMME.affectations;
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Jour du calendrier AAAA-MM-JJ réellement existant (refuse le 31 février). */
const jourValide = z
  .string()
  .regex(FORMAT_JOUR, { error: textes.erreurs.dateInvalide })
  .refine((jour) => new Date(`${jour}T00:00:00Z`).toISOString().startsWith(jour), { error: textes.erreurs.dateInvalide });

const schemaAffectation = z
  .discriminatedUnion("typeCible", [
    z.object({ typeCible: z.literal("groupe"), groupeId: z.uuid({ error: textes.erreurs.groupeVide }) }),
    z.object({ typeCible: z.literal("employe"), employeId: z.uuid({ error: textes.erreurs.employeVide }) }),
  ], { error: textes.erreurs.cibleVide })
  .and(
    z.object({
      rotationId: z.uuid({ error: textes.erreurs.rotationVide }),
      dateDebut: jourValide,
      dateFin: z.union([z.literal("").transform(() => null), jourValide]),
    }),
  )
  .refine((a) => a.dateFin === null || a.dateFin >= a.dateDebut, { error: textes.erreurs.datesIncoherentes, path: ["dateFin"] });

export type DonneesAffectation = {
  rotationId: string;
  groupeId: string | null;
  employeId: string | null;
  dateDebut: string;
  dateFin: string | null;
};

/** Valide le formulaire d'une affectation : une seule cible (groupe ou employé), une rotation, une période. */
export function validerAffectation(formulaire: FormData): Resultat<DonneesAffectation> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaAffectation.safeParse({
    typeCible: lireTexte(formulaire.get("typeCible")),
    groupeId: lireTexte(formulaire.get("groupeId")),
    employeId: lireTexte(formulaire.get("employeId")),
    rotationId: lireTexte(formulaire.get("rotationId")),
    dateDebut: lireTexte(formulaire.get("dateDebut")),
    dateFin: lireTexte(formulaire.get("dateFin")),
  });
  if (!analyse.success) return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
  const { data } = analyse;
  return {
    ok: true,
    donnees: {
      rotationId: data.rotationId,
      groupeId: data.typeCible === "groupe" ? data.groupeId : null,
      employeId: data.typeCible === "employe" ? data.employeId : null,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
    },
  };
}
