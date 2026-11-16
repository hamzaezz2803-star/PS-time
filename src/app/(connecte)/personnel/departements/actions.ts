"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  insererDepartement,
  listerDepartements,
  mettreAJourDepartement,
  supprimerDepartementParId,
} from "@/lib/donnees/departements";
import { estEncoreReference, indexEnDoublon } from "@/lib/donnees/erreurs";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { siteExiste } from "@/lib/donnees/sites";
import { TEXTES_SITES } from "@/lib/textes/sites";
import { nomDejaPris, peutDeplacer } from "@/lib/metier/arbre";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import { validerDepartement } from "@/lib/validation/departement";
import type { EtatFormulaireDepartement } from "@/types";

const { erreurs, formulaire: textes } = TEXTES_DEPARTEMENTS;

/** Les droits viennent toujours de la session. Pour l'instant : super administrateur uniquement. */
async function aLesDroits(): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin;
}

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un département`, {
    type: erreur instanceof Error ? erreur.name : "inconnu",
  });
}

/** Crée un département (sans `id`) ou modifie un département existant (avec `id`). */
export async function enregistrerDepartement(
  _etatPrecedent: EtatFormulaireDepartement,
  formulaire: FormData,
): Promise<EtatFormulaireDepartement> {
  if (!(await aLesDroits())) return { message: erreurs.droits };

  const validation = validerDepartement(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  const { id, nom, parentId, siteId } = validation.donnees;

  const liste = await listerDepartements();
  if (!(await siteExiste(siteId))) {
    return { erreursChamps: { siteId: TEXTES_SITES.champ.introuvable } };
  }
  if (parentId && !liste.some((departement) => departement.id === parentId)) {
    return { erreursChamps: { parentId: erreurs.parentIntrouvable } };
  }
  if (id && !liste.some((departement) => departement.id === id)) {
    refresh();
    return { message: erreurs.introuvable };
  }
  if (id && !peutDeplacer(liste, id, parentId)) {
    return { erreursChamps: { parentId: erreurs.boucle } };
  }
  if (nomDejaPris(liste, nom, parentId, id)) {
    return { erreursChamps: { nom: erreurs.nomDejaPris } };
  }

  let idSelectionne: string;
  try {
    if (id) {
      await mettreAJourDepartement(id, { nom, parentId, siteId });
      idSelectionne = id;
    } else {
      idSelectionne = await insererDepartement({ nom, parentId, siteId });
    }
  } catch (erreur) {
    if (indexEnDoublon(erreur) !== null) return { erreursChamps: { nom: erreurs.nomDejaPris } };
    journaliserEchec("de l'enregistrement", erreur);
    return { message: erreurs.echec };
  }

  refresh();
  return {
    succes: { message: id ? textes.modifie : textes.cree, idSelectionne },
  };
}

export async function supprimerDepartement(
  _etatPrecedent: EtatFormulaireDepartement,
  formulaire: FormData,
): Promise<EtatFormulaireDepartement> {
  if (!(await aLesDroits())) return { message: erreurs.droits };

  const analyse = z.uuid().safeParse(formulaire.get("id"));
  if (!analyse.success) return { message: erreurs.introuvable };
  const id = analyse.data;

  const liste = await listerDepartements();
  const departement = liste.find((element) => element.id === id);
  if (!departement) {
    refresh();
    return { message: erreurs.introuvable };
  }
  // Vérifié ici pour un message clair ; la clé étrangère (restrict) le garantit aussi en base.
  if (liste.some((element) => element.parentId === id)) {
    return { message: erreurs.aDesEnfants };
  }

  try {
    await supprimerDepartementParId(id);
  } catch (erreur) {
    // Clé étrangère « restrict » : des employés sont encore rattachés à ce département.
    if (estEncoreReference(erreur)) return { message: erreurs.aDesEmployes };
    journaliserEchec("de la suppression", erreur);
    return { message: erreurs.echec };
  }

  refresh();
  return {
    succes: { message: textes.supprime, idSelectionne: departement.parentId },
  };
}
