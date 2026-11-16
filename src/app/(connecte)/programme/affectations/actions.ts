"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutGererModule } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_AFFECTATIONS } from "@/lib/constantes";
import { formaterJour } from "@/lib/formats";
import { enregistrerAffectation as enregistrerEnBase, supprimerAffectationParId } from "@/lib/donnees/affectations";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { validerAffectation } from "@/lib/validation/affectation";
import type { EtatFormulaire } from "@/types";

const textes = TEXTES_PROGRAMME.affectations;
const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'une affectation`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Crée une affectation (sans `id`) ou la modifie (avec `id`), sans chevauchement pour la même cible. */
export async function enregistrerAffectation(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerAffectation(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    const resultat = await enregistrerEnBase(id ? id.data : null, validation.donnees);
    if (!resultat.ok) {
      if (resultat.erreur === "chevauchement") return { erreursChamps: { dateDebut: textes.erreurs.chevauchement } };
      refresh();
      return { message: resultat.erreur === "introuvable" ? textes.introuvable : textes.erreurs.introuvables };
    }
    refresh();
    const { dateDebut, dateFin } = validation.donnees;
    await notifier("affectation", id ? "modification" : "creation", dateFin ? `${formaterJour(dateDebut)} → ${formaterJour(dateFin)}` : formaterJour(dateDebut), CHEMIN_AFFECTATIONS);
    return { succes: { message: id ? textes.modifie : textes.cree, idSelectionne: resultat.id } };
  } catch (erreur) {
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.echec };
  }
}

export async function supprimerAffectation(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  try {
    await supprimerAffectationParId(id.data);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  refresh();
  await notifier("affectation", "suppression", null, CHEMIN_AFFECTATIONS);
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
