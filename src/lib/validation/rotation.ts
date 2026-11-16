import { z } from "zod";
import { JOURS_PAR_SEMAINE, JOURS_ROTATION_MAX, LONGUEUR_MAX_NOM_PROGRAMME, TYPES_ROTATION } from "@/lib/constantes";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Resultat, Rotation } from "@/types";
import { entierBorne, lireTexte, nomObligatoire, premieresErreurs } from "./commun";

const textes = TEXTES_PROGRAMME.rotations;

/** Nom du champ du profil horaire d'un jour (0 = lundi ou jour 1 du cycle). */
export const champJour = (numero: number) => `jour_${numero}`;

const schemaEntete = z.object({
  nom: nomObligatoire(LONGUEUR_MAX_NOM_PROGRAMME, textes.nomVide, textes.nomTropLong),
  type: z.enum(TYPES_ROTATION, { error: textes.erreurs.typeInvalide }),
  nombreJours: entierBorne(1, JOURS_ROTATION_MAX, textes.nombreInvalide(1, JOURS_ROTATION_MAX)),
});
const profilDuJour = z.union([z.literal(""), z.uuid({ error: textes.erreurs.profilIntrouvable })]);

export type DonneesRotation = Omit<Rotation, "id">;

/** Valide le formulaire d'une rotation : en-tête, puis le profil horaire de chaque jour (vide = repos). */
export function validerRotation(formulaire: FormData): Resultat<DonneesRotation> & { erreursChamps?: Record<string, string> } {
  const entete = schemaEntete.safeParse({
    nom: lireTexte(formulaire.get("nom")),
    type: lireTexte(formulaire.get("type")),
    // Une semaine type compte toujours 7 jours, quel que soit le champ envoyé.
    nombreJours: formulaire.get("type") === "hebdomadaire" ? String(JOURS_PAR_SEMAINE) : lireTexte(formulaire.get("nombreJours")),
  });
  if (!entete.success) return { ok: false, erreur: "validation", erreursChamps: premieresErreurs(entete.error) };

  const jours: Record<number, string> = {};
  for (let numero = 0; numero < entete.data.nombreJours; numero += 1) {
    const profil = profilDuJour.safeParse(lireTexte(formulaire.get(champJour(numero))));
    if (!profil.success) return { ok: false, erreur: "validation", erreursChamps: { jours: textes.erreurs.profilIntrouvable } };
    if (profil.data) jours[numero] = profil.data;
  }
  if (Object.keys(jours).length === 0) return { ok: false, erreur: "validation", erreursChamps: { jours: textes.erreurs.aucunJour } };
  return { ok: true, donnees: { ...entete.data, jours } };
}
