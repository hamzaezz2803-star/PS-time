"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { obtenirUtilisateurPourEspace, type UtilisateurConnecte } from "@/lib/donnees/session";
import { creerAdministrateur, listerUtilisateurs, modifierUtilisateur, supprimerAdministrateur } from "@/lib/donnees/utilisateurs";
import { TEXTES_UTILISATEURS as textes } from "@/lib/textes/utilisateurs";
import { validerCreationUtilisateur, validerModificationUtilisateur } from "@/lib/validation/utilisateur";
import type { EtatFormulaire } from "@/types";

/** Super administrateur connecté, ou null. Les droits viennent toujours de la session. */
async function superAdministrateur(): Promise<UtilisateurConnecte | null> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin ? utilisateur : null;
}

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un compte`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Crée un administrateur avec un mot de passe provisoire et ses modules. */
export async function creerUtilisateur(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const auteur = await superAdministrateur();
  if (!auteur) return { message: textes.droits };

  const validation = validerCreationUtilisateur(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  const { identifiant, nom, motDePasse, modules } = validation.donnees;

  try {
    const id = await creerAdministrateur({ identifiant, nom, motDePasse, modules });
    // Journal d'audit : création d'un compte et droits accordés (jamais le mot de passe).
    console.info("Compte administrateur créé", { par: auteur.identifiant, identifiant, modules });
    refresh();
    return { succes: { message: textes.cree, idSelectionne: id } };
  } catch (erreur) {
    if (indexEnDoublon(erreur) !== null) return { erreursChamps: { identifiant: textes.erreurs.identifiantDejaPris } };
    journaliserEchec("de la création", erreur);
    return { message: textes.echec };
  }
}

/** Modifie nom, état, modules et, au besoin, le mot de passe provisoire d'un compte. */
export async function modifierCompte(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const auteur = await superAdministrateur();
  if (!auteur) return { message: textes.droits };

  const validation = validerModificationUtilisateur(formulaire);
  if (!validation.ok) {
    if (validation.erreursChamps?.id) return { message: textes.introuvable };
    return { erreursChamps: validation.erreursChamps };
  }
  const { id, nom, estActif, modules, motDePasse } = validation.donnees;
  if (id === auteur.id && !estActif) return { erreursChamps: { estActif: textes.erreurs.pasSoiMeme } };

  try {
    if (!(await modifierUtilisateur(id, { nom, estActif, modules, motDePasse }))) {
      refresh();
      return { message: textes.introuvable };
    }
  } catch (erreur) {
    journaliserEchec("de la modification", erreur);
    return { message: textes.echec };
  }
  console.info("Compte modifié", { par: auteur.identifiant, compte: id, estActif, modules, nouveauMotDePasse: motDePasse !== null });
  refresh();
  return { succes: { message: textes.modifie, idSelectionne: id } };
}

/** Supprime un administrateur (jamais soi-même ni un super administrateur). */
export async function supprimerCompte(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const auteur = await superAdministrateur();
  if (!auteur) return { message: textes.droits };

  const id = z.uuid().safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  if (id.data === auteur.id) return { message: textes.erreurs.pasSoiMeme };
  const cible = (await listerUtilisateurs()).find((utilisateur) => utilisateur.id === id.data);
  if (!cible) {
    refresh();
    return { message: textes.introuvable };
  }
  if (cible.estSuperAdmin) return { message: textes.erreurs.superAdminProtege };

  try {
    await supprimerAdministrateur(id.data);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  console.info("Compte supprimé", { par: auteur.identifiant, identifiant: cible.identifiant });
  refresh();
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
