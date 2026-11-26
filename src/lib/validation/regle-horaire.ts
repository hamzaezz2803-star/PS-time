import { z } from "zod";
import { COULEUR_REGLE_DEFAUT, COULEURS_REGLE, type CouleurRegle } from "@/lib/constantes";
import { normaliserJours } from "@/lib/metier/horaire-dynamique";
import { TEXTES_HORAIRE_DYNAMIQUE } from "@/lib/textes/horaire-dynamique";
import type { Resultat } from "@/types";
import { lireTexte, premieresErreurs } from "./commun";
import { heureDePlage } from "./profil-horaire";

const { erreurs } = TEXTES_HORAIRE_DYNAMIQUE;

/** Heure « HH:MM » en minutes depuis minuit. */
const heure = z.string().transform((saisie, contexte) => {
  const minutes = heureDePlage(saisie);
  if (minutes === null) {
    contexte.addIssue({ code: "custom", message: erreurs.heureInvalide });
    return z.NEVER;
  }
  return minutes;
});

const schemaRegle = z
  .object({
    debut: heure,
    fin: heure,
    profilId: z.uuid({ error: erreurs.profilVide }),
    jours: z.array(z.string()),
    estActif: z.boolean(),
    couleur: z.enum(COULEURS_REGLE, { error: erreurs.couleurInvalide }),
  })
  .refine((regle) => regle.fin > regle.debut, { error: erreurs.fenetreInvalide, path: ["fin"] });

export type DonneesRegleHoraire = { debut: number; fin: number; profilId: string; jours: number[]; estActif: boolean; couleur: CouleurRegle };

/** Valide le formulaire d'une règle : fenêtre du même jour, profil, jours (aucun = tous), active ou non. */
export function validerRegleHoraire(formulaire: FormData): Resultat<DonneesRegleHoraire> & { erreursChamps?: Record<string, string> } {
  const analyse = schemaRegle.safeParse({
    debut: lireTexte(formulaire.get("debut")),
    fin: lireTexte(formulaire.get("fin")),
    profilId: lireTexte(formulaire.get("profilId")),
    jours: formulaire.getAll("jours").map(lireTexte),
    estActif: formulaire.get("estActif") === "oui",
    couleur: lireTexte(formulaire.get("couleur")) || COULEUR_REGLE_DEFAUT,
  });
  if (!analyse.success) return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(analyse.error) };
  const { jours, ...reste } = analyse.data;
  return { ok: true, donnees: { ...reste, jours: normaliserJours(jours.map(Number)) } };
}
