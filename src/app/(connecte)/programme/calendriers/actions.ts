"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { estSuperAdministrateur } from "@/lib/actions/droits";
import {
  calendrierEstUtilise,
  insererCalendrier,
  mettreAJourCalendrier,
  supprimerCalendrierParId,
} from "@/lib/donnees/calendriers";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { validerCalendrier } from "@/lib/validation/calendrier";
import type { EtatFormulaire } from "@/types";

const textes = TEXTES_PROGRAMME.calendriers;
const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un calendrier`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Crée un calendrier (sans `id`) ou modifie un calendrier existant (avec `id`). */
export async function enregistrerCalendrier(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await estSuperAdministrateur())) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerCalendrier(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    if (id) {
      if (!(await mettreAJourCalendrier(id.data, validation.donnees))) {
        refresh();
        return { message: textes.introuvable };
      }
      refresh();
      return { succes: { message: textes.modifie, idSelectionne: id.data } };
    }
    const nouvelId = await insererCalendrier(validation.donnees);
    refresh();
    return { succes: { message: textes.cree, idSelectionne: nouvelId } };
  } catch (erreur) {
    if (indexEnDoublon(erreur) !== null) return { erreursChamps: { nom: textes.erreurs.nomDejaPris } };
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.echec };
  }
}

export async function supprimerCalendrier(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await estSuperAdministrateur())) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  // Vérifié ici pour un message clair ; la clé étrangère (restrict) le garantit aussi en base.
  if (await calendrierEstUtilise(id.data)) return { message: textes.erreurs.utilise };

  try {
    await supprimerCalendrierParId(id.data);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  refresh();
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
