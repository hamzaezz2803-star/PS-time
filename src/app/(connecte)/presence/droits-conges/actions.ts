"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutAccederPage } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_DROITS_CONGES } from "@/lib/constantes";
import { creerDroits as creerEnBase, modifierDroit as modifierEnBase, supprimerDroit as supprimerEnBase } from "@/lib/donnees/droits-conges";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import { TEXTES_NOTIFICATIONS } from "@/lib/textes/notifications";
import { validerCreationDroits, validerDroit } from "@/lib/validation/droit-conge";
import type { EtatFormulaire } from "@/types";

const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un droit aux congés`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Attribue le même droit (événement, période, jours) à chaque employé coché. */
export async function creerDroits(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  // Les droits d'accès et l'auteur viennent de la session, jamais du formulaire.
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "droits_conges")) return { message: textes.droits };

  const validation = validerCreationDroits(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  const { donnees } = validation;

  try {
    const resultat = await creerEnBase(donnees, utilisateur.id);
    if (!resultat.ok) {
      if (resultat.erreur === "chevauchement") return { erreursChamps: { employeIds: textes.erreurs.chevauchement(resultat.noms.join(", ")) } };
      if (resultat.erreur === "employe") return { erreursChamps: { employeIds: textes.erreurs.employeIntrouvable } };
      return { erreursChamps: { evenementId: textes.erreurs.evenementIntrouvable } };
    }
    // Journal d'audit : qui, combien, quelle période. Aucune donnée d'employé.
    console.info("Droits aux congés attribués", { utilisateurId: utilisateur.id, employes: resultat.nombre, debut: donnees.du, fin: donnees.au });
    await notifier("droit_conge", "creation", TEXTES_NOTIFICATIONS.libelleAbsences(resultat.evenementNom, resultat.nombre), CHEMIN_DROITS_CONGES);
    refresh();
    return { succes: { message: textes.cree(resultat.nombre), idSelectionne: null } };
  } catch (erreur) {
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.erreurs.echec };
  }
}

/** Modifie la période, les jours, le blocage ou la remarque d'un droit. */
export async function modifierDroit(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("droits_conges"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.erreurs.introuvable };
  const validation = validerDroit(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    const resultat = await modifierEnBase(id.data, validation.donnees);
    if (!resultat.ok) {
      refresh();
      return resultat.erreur === "chevauchement" ? { erreursChamps: { du: textes.erreurs.chevauchement("cet employé") } } : { message: textes.erreurs.introuvable };
    }
    await notifier("droit_conge", "modification", resultat.nom, CHEMIN_DROITS_CONGES);
    refresh();
    return { succes: { message: textes.modifie, idSelectionne: id.data } };
  } catch (erreur) {
    journaliserEchec("de la modification", erreur);
    return { message: textes.erreurs.echec };
  }
}

export async function supprimerDroit(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("droits_conges"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.erreurs.introuvable };
  try {
    const existait = await supprimerEnBase(id.data);
    refresh();
    if (!existait) return { message: textes.erreurs.introuvable };
    await notifier("droit_conge", "suppression", null, CHEMIN_DROITS_CONGES);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.erreurs.echecSuppression };
  }
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
