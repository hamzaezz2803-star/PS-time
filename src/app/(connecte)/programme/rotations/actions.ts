"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutGererModule } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_ROTATIONS } from "@/lib/constantes";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { profilsExistent } from "@/lib/donnees/profils-horaires";
import {
  enregistrerRotation as enregistrerEnBase,
  listerRotations,
  rotationEstUtilisee,
  supprimerRotationParId,
} from "@/lib/donnees/rotations";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { validerRotation } from "@/lib/validation/rotation";
import type { EtatFormulaire } from "@/types";

const textes = TEXTES_PROGRAMME.rotations;
const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'une rotation`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Crée une rotation (sans `id`) ou la modifie (avec `id`), jours compris. */
export async function enregistrerRotation(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerRotation(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  if (!(await profilsExistent(Object.values(validation.donnees.jours)))) {
    return { erreursChamps: { jours: textes.erreurs.profilIntrouvable } };
  }

  try {
    const idRotation = await enregistrerEnBase(id ? id.data : null, validation.donnees);
    refresh();
    if (!idRotation) return { message: textes.introuvable };
    await notifier("rotation", id ? "modification" : "creation", validation.donnees.nom, CHEMIN_ROTATIONS);
    return { succes: { message: id ? textes.modifie : textes.cree, idSelectionne: idRotation } };
  } catch (erreur) {
    if (indexEnDoublon(erreur) !== null) return { erreursChamps: { nom: textes.erreurs.nomDejaPris } };
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.echec };
  }
}

export async function supprimerRotation(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  // Vérifié ici pour un message clair ; la clé étrangère (restrict) le garantit aussi en base.
  if (await rotationEstUtilisee(id.data)) return { message: textes.erreurs.utilisee };

  let nom: string | null = null;
  try {
    nom = (await listerRotations()).find((element) => element.id === id.data)?.nom ?? null;
    await supprimerRotationParId(id.data);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  await notifier("rotation", "suppression", nom, CHEMIN_ROTATIONS);
  refresh();
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
