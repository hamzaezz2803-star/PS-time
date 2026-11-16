"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import {
  insererPoste,
  listerPostes,
  mettreAJourPoste,
  supprimerPosteParId,
} from "@/lib/donnees/postes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { siteExiste } from "@/lib/donnees/sites";
import { TEXTES_SITES } from "@/lib/textes/sites";
import { nomDejaPris, peutDeplacer } from "@/lib/metier/arbre";
import { codeDejaPris } from "@/lib/metier/postes";
import { TEXTES_POSTES } from "@/lib/textes/postes";
import { validerPoste } from "@/lib/validation/poste";
import type { EtatFormulairePoste } from "@/types";

const { erreurs, formulaire: textes } = TEXTES_POSTES;

/** Les droits viennent toujours de la session. Pour l'instant : super administrateur uniquement. */
async function aLesDroits(): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin;
}

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un poste`, {
    type: erreur instanceof Error ? erreur.name : "inconnu",
  });
}

/** Crée un poste (sans `id`) ou modifie un poste existant (avec `id`). */
export async function enregistrerPoste(
  _etatPrecedent: EtatFormulairePoste,
  formulaire: FormData,
): Promise<EtatFormulairePoste> {
  if (!(await aLesDroits())) return { message: erreurs.droits };

  const validation = validerPoste(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  const { id, ...donnees } = validation.donnees;

  const liste = await listerPostes();
  if (!(await siteExiste(donnees.siteId))) {
    return { erreursChamps: { siteId: TEXTES_SITES.champ.introuvable } };
  }
  if (donnees.parentId &&!liste.some((poste) => poste.id === donnees.parentId)) {
    return { erreursChamps: { parentId: erreurs.parentIntrouvable } };
  }
  if (id && !liste.some((poste) => poste.id === id)) {
    refresh();
    return { message: erreurs.introuvable };
  }
  if (id && !peutDeplacer(liste, id, donnees.parentId)) {
    return { erreursChamps: { parentId: erreurs.boucle } };
  }
  if (codeDejaPris(liste, donnees.code, id)) {
    return { erreursChamps: { code: erreurs.codeDejaPris } };
  }
  if (nomDejaPris(liste, donnees.nom, donnees.parentId, id)) {
    return { erreursChamps: { nom: erreurs.nomDejaPris } };
  }

  let idSelectionne: string;
  try {
    if (id) {
      await mettreAJourPoste(id, donnees);
      idSelectionne = id;
    } else {
      idSelectionne = await insererPoste(donnees);
    }
  } catch (erreur) {
    // Enregistré entre-temps par quelqu'un d'autre : l'index violé indique le champ.
    const index = indexEnDoublon(erreur);
    if (index === "postes_code_idx") return { erreursChamps: { code: erreurs.codeDejaPris } };
    if (index !== null) return { erreursChamps: { nom: erreurs.nomDejaPris } };
    journaliserEchec("de l'enregistrement", erreur);
    return { message: erreurs.echec };
  }

  refresh();
  return { succes: { message: id ? textes.modifie : textes.cree, idSelectionne } };
}

export async function supprimerPoste(
  _etatPrecedent: EtatFormulairePoste,
  formulaire: FormData,
): Promise<EtatFormulairePoste> {
  if (!(await aLesDroits())) return { message: erreurs.droits };

  const analyse = z.uuid().safeParse(formulaire.get("id"));
  if (!analyse.success) return { message: erreurs.introuvable };
  const id = analyse.data;

  const liste = await listerPostes();
  const poste = liste.find((element) => element.id === id);
  if (!poste) {
    refresh();
    return { message: erreurs.introuvable };
  }
  // Vérifié ici pour un message clair ; la clé étrangère (restrict) le garantit aussi en base.
  if (liste.some((element) => element.parentId === id)) {
    return { message: erreurs.aDesEnfants };
  }

  try {
    await supprimerPosteParId(id);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: erreurs.echec };
  }

  refresh();
  return { succes: { message: textes.supprime, idSelectionne: poste.parentId } };
}
