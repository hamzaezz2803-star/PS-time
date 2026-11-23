"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutAccederPage } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_DROITS_CONGES, PIECES_JOINTES_PAR_DROIT_MAX } from "@/lib/constantes";
import { confirmerDroit as confirmerEnBase, creerDroits as creerEnBase, modifierDroit as modifierEnBase, supprimerDroit as supprimerEnBase } from "@/lib/donnees/droits-conges";
import { ajouterPiecesAuDroit, retirerPieceDuDroit } from "@/lib/donnees/pieces-jointes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import { TEXTES_NOTIFICATIONS } from "@/lib/textes/notifications";
import { validerCreationDroits, validerDroit } from "@/lib/validation/droit-conge";
import { lirePiecesJointes } from "@/lib/validation/piece-jointe";
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
  const pieces = await lirePiecesJointes(formulaire, formulaire.get("aPieceJointe") === "oui");
  if (!validation.ok || !pieces.ok) {
    return { erreursChamps: { ...(validation.ok ? {} : validation.erreursChamps), ...(pieces.ok ? {} : { fichiers: pieces.erreur }) } };
  }
  const { donnees } = validation;

  try {
    // Sans la case cochée, aucun fichier n'est gardé (même s'il en restait un dans le champ).
    const resultat = await creerEnBase(donnees, formulaire.get("aPieceJointe") === "oui" ? pieces.pieces : [], utilisateur.id);
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
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "droits_conges")) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.erreurs.introuvable };
  const avecPieces = formulaire.get("aPieceJointe") === "oui";
  const validation = validerDroit(formulaire);
  const pieces = await lirePiecesJointes(formulaire, avecPieces);
  if (!validation.ok || !pieces.ok) {
    return { erreursChamps: { ...(validation.ok ? {} : validation.erreursChamps), ...(pieces.ok ? {} : { fichiers: pieces.erreur }) } };
  }

  try {
    const resultat = await modifierEnBase(id.data, validation.donnees, avecPieces ? pieces.pieces : [], utilisateur.id);
    if (!resultat.ok) {
      if (resultat.erreur === "trop_de_pieces") return { erreursChamps: { fichiers: textes.erreurs.tropDePieces(PIECES_JOINTES_PAR_DROIT_MAX) } };
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

/** Ajoute des pièces justificatives à un droit (fenêtre « Pièces jointes » de la liste). */
export async function ajouterPiecesJointes(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "droits_conges")) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.erreurs.introuvable };
  const pieces = await lirePiecesJointes(formulaire, true);
  if (!pieces.ok) return { erreursChamps: { fichiers: pieces.erreur } };

  try {
    const resultat = await ajouterPiecesAuDroit(id.data, pieces.pieces, utilisateur.id);
    if (!resultat.ok) {
      return resultat.erreur === "trop" ? { erreursChamps: { fichiers: textes.erreurs.tropDePieces(PIECES_JOINTES_PAR_DROIT_MAX) } } : { message: textes.erreurs.introuvable };
    }
    // Journal d'audit : qui, combien de fichiers. Jamais leur contenu.
    console.info("Pièces jointes ajoutées à un droit aux congés", { utilisateurId: utilisateur.id, fichiers: pieces.pieces.length });
    await notifier("droit_conge", "modification", resultat.nom, CHEMIN_DROITS_CONGES);
    refresh();
    return { succes: { message: textes.piecesAjoutees(pieces.pieces.length), idSelectionne: id.data } };
  } catch (erreur) {
    journaliserEchec("de l'ajout des pièces jointes", erreur);
    return { message: textes.erreurs.echecPieces };
  }
}

/** Retire une pièce justificative d'un droit. */
export async function retirerPieceJointe(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("droits_conges"))) return { message: textes.droits };

  const droitId = identifiant.safeParse(formulaire.get("droitId"));
  const pieceId = identifiant.safeParse(formulaire.get("pieceId"));
  if (!droitId.success || !pieceId.success) return { message: textes.erreurs.pieceIntrouvable };
  try {
    const nom = await retirerPieceDuDroit(droitId.data, pieceId.data);
    refresh();
    if (nom === null) return { message: textes.erreurs.pieceIntrouvable };
    await notifier("droit_conge", "modification", nom, CHEMIN_DROITS_CONGES);
    return { succes: { message: textes.pieceRetiree, idSelectionne: droitId.data } };
  } catch (erreur) {
    journaliserEchec("du retrait d'une pièce jointe", erreur);
    return { message: textes.erreurs.echecPieces };
  }
}

/** Confirme un droit provisoire : ses jours deviennent utilisables. */
export async function confirmerDroit(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("droits_conges"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.erreurs.introuvable };
  try {
    const nom = await confirmerEnBase(id.data);
    refresh();
    if (nom === null) return { message: textes.erreurs.introuvable };
    await notifier("droit_conge", "modification", nom, CHEMIN_DROITS_CONGES);
    return { succes: { message: textes.confirme, idSelectionne: id.data } };
  } catch (erreur) {
    journaliserEchec("de la confirmation", erreur);
    return { message: textes.erreurs.echecConfirmation };
  }
}
