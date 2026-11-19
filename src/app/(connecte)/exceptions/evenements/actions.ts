"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutAccederPage } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_EVENEMENTS } from "@/lib/constantes";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { enregistrerEvenement as enregistrerEnBase, supprimerEvenementParId } from "@/lib/donnees/evenements";
import { TEXTES_EVENEMENTS as textes } from "@/lib/textes/evenements";
import { validerEvenement } from "@/lib/validation/evenement";
import type { EtatFormulaire } from "@/types";

const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un événement`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Crée un événement (sans `id`) ou le modifie (avec `id`), périodes de prise comprises. */
export async function enregistrerEvenement(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("evenements"))) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerEvenement(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    const idEvenement = await enregistrerEnBase(id ? id.data : null, validation.donnees);
    refresh();
    if (!idEvenement) return { message: textes.introuvable };
    await notifier("evenement", id ? "modification" : "creation", validation.donnees.nom, CHEMIN_EVENEMENTS);
    return { succes: { message: id ? textes.modifie : textes.cree, idSelectionne: idEvenement } };
  } catch (erreur) {
    const index = indexEnDoublon(erreur);
    if (index === "evenements_code_idx") return { erreursChamps: { code: textes.erreurs.codeDejaPris } };
    if (index !== null) return { erreursChamps: { nom: textes.erreurs.nomDejaPris } };
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.echec };
  }
}

export async function supprimerEvenement(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("evenements"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  let nom: string | null;
  try {
    nom = await supprimerEvenementParId(id.data);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  refresh();
  if (nom === null) return { message: textes.introuvable };
  await notifier("evenement", "suppression", nom, CHEMIN_EVENEMENTS);
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
