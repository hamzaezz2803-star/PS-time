"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutAccederPage } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_ABSENCES } from "@/lib/constantes";
import { enregistrerAbsences, supprimerAbsence as supprimerEnBase } from "@/lib/donnees/absences";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { TEXTES_ABSENCES as textes } from "@/lib/textes/absences";
import { TEXTES_NOTIFICATIONS } from "@/lib/textes/notifications";
import { validerAbsences } from "@/lib/validation/absence";
import type { EtatFormulaire } from "@/types";

const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'une absence`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Attribue le même événement, sur la même période, à chaque employé coché. */
export async function creerAbsences(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  // Les droits et l'auteur viennent de la session, jamais du formulaire.
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "absences")) return { message: textes.droits };

  const validation = validerAbsences(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  const { donnees } = validation;

  try {
    const resultat = await enregistrerAbsences(donnees, utilisateur.id);
    if (!resultat.ok) {
      if (resultat.erreur === "chevauchement") return { erreursChamps: { employeIds: textes.erreurs.chevauchement(resultat.noms.join(", ")) } };
      if (resultat.erreur === "solde_insuffisant") return { erreursChamps: { employeIds: textes.erreurs.soldeInsuffisant(resultat.noms.join(", ")) } };
      if (resultat.erreur === "employe") return { erreursChamps: { employeIds: textes.erreurs.employeIntrouvable } };
      if (resultat.erreur === "pas_en_heures") return { erreursChamps: { de: textes.erreurs.pasEnHeures } };
      if (resultat.erreur === "hors_periode") return { erreursChamps: { evenementId: textes.erreurs.horsPeriodePrise } };
      return { erreursChamps: { evenementId: textes.erreurs.evenementIntrouvable } };
    }
    // Journal d'audit : qui, combien, quelle période. Aucune donnée d'employé.
    console.info("Absences ajoutées", { utilisateurId: utilisateur.id, employes: resultat.nombre, debut: donnees.saisie.debut, fin: donnees.saisie.fin });
    await notifier("absence", "creation", TEXTES_NOTIFICATIONS.libelleAbsences(resultat.evenementNom, resultat.nombre), CHEMIN_ABSENCES);
    refresh();
    return { succes: { message: textes.cree(resultat.nombre), idSelectionne: null } };
  } catch (erreur) {
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.erreurs.echec };
  }
}

export async function supprimerAbsence(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("absences"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.erreurs.introuvable };
  try {
    const existait = await supprimerEnBase(id.data);
    refresh();
    if (!existait) return { message: textes.erreurs.introuvable };
    await notifier("absence", "suppression", null, CHEMIN_ABSENCES);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.erreurs.echecSuppression };
  }
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
