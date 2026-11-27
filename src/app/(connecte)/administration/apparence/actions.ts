"use server";

import { refresh, updateTag } from "next/cache";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_APPARENCE, LIMITE_EVENEMENTS } from "@/lib/constantes";
import { ETIQUETTE_APPARENCE, enregistrerApparence } from "@/lib/donnees/apparence";
import { enregistrerCouleursPlanning } from "@/lib/donnees/couleurs-planning";
import { lireChoixCouleurs } from "@/lib/metier/couleurs-planning";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_APPARENCE as textes } from "@/lib/textes/apparence";
import { validerApparence } from "@/lib/validation/apparence";
import type { EtatFormulaire } from "@/types";

/** Enregistre l'apparence de l'installation (super administrateur seulement, lu dans la session). */
export async function modifierApparence(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const auteur = await obtenirUtilisateurPourEspace();
  if (!auteur.estSuperAdmin) return { message: textes.droits };

  const validation = validerApparence(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  const { theme, police, taille } = validation.donnees;

  try {
    await enregistrerApparence(validation.donnees, auteur.id);
  } catch (erreur) {
    console.error("Échec de l'enregistrement de l'apparence", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { message: textes.echec };
  }
  updateTag(ETIQUETTE_APPARENCE);
  console.info("Apparence modifiée", { par: auteur.identifiant, theme, police, taille });
  await notifier("apparence", "modification", `${textes.themes[theme].libelle}, ${textes.polices[police].libelle}, ${textes.tailles[taille].libelle.toLocaleLowerCase("fr")}`, CHEMIN_APPARENCE);
  refresh();
  return { succes: { message: textes.enregistre, idSelectionne: null } };
}

/** Couleurs envoyées au plus en une fois : tous les événements et tous les profils horaires. */
const COULEURS_PLANNING_MAX = LIMITE_EVENEMENTS * 2;

/** Enregistre la couleur de chaque événement et profil horaire dans le planning (super administrateur seulement). */
export async function modifierCouleursPlanning(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const auteur = await obtenirUtilisateurPourEspace();
  if (!auteur.estSuperAdmin) return { message: textes.droits };

  const lecture = lireChoixCouleurs(formulaire.entries(), COULEURS_PLANNING_MAX);
  if (!lecture.ok) return { message: textes.couleursPlanning[lecture.erreur] };

  let modifiees: number;
  try {
    modifiees = await enregistrerCouleursPlanning(lecture.choix);
  } catch (erreur) {
    console.error("Échec de l'enregistrement des couleurs du planning", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { message: textes.echec };
  }
  if (modifiees === 0) return { succes: { message: textes.couleursPlanning.rienAChanger, idSelectionne: null } };
  console.info("Couleurs du planning modifiées", { par: auteur.identifiant, nombre: modifiees });
  await notifier("apparence", "modification", textes.couleursPlanning.libelleNotification(modifiees), CHEMIN_APPARENCE);
  refresh();
  return { succes: { message: textes.couleursPlanning.enregistre(modifiees), idSelectionne: null } };
}
