"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutGererModule } from "@/lib/actions/droits";
import { estEncoreReference, indexEnDoublon } from "@/lib/donnees/erreurs";
import { enregistrerProfil as enregistrerEnBase, profilEstUtilise, supprimerProfilParId } from "@/lib/donnees/profils-horaires";
import { TEXTES_PROFILS as textes } from "@/lib/textes/profils-horaires";
import { validerProfil } from "@/lib/validation/profil-horaire";
import type { EtatFormulaire } from "@/types";

const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un profil horaire`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Crée un profil horaire (sans `id`) ou le modifie (avec `id`), plages comprises. */
export async function enregistrerProfil(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerProfil(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    const idProfil = await enregistrerEnBase(id ? id.data : null, validation.donnees);
    refresh();
    if (!idProfil) return { message: textes.introuvable };
    return { succes: { message: id ? textes.modifie : textes.cree, idSelectionne: idProfil } };
  } catch (erreur) {
    const index = indexEnDoublon(erreur);
    if (index === "profils_horaires_code_idx") return { erreursChamps: { code: textes.erreurs.codeDejaPris } };
    if (index !== null) return { erreursChamps: { nom: textes.erreurs.nomDejaPris } };
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.echec };
  }
}

export async function supprimerProfil(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  if (await profilEstUtilise(id.data)) return { message: textes.erreurs.utilise };
  try {
    await supprimerProfilParId(id.data);
  } catch (erreur) {
    // Utilisé entre-temps par une rotation (clé « restrict »).
    if (estEncoreReference(erreur)) return { message: textes.erreurs.utilise };
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  refresh();
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
