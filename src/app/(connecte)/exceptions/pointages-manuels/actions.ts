"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { estSuperAdministrateur } from "@/lib/actions/droits";
import { employesExistent } from "@/lib/donnees/groupes";
import { evaluerPointages, groupesDesEmployes } from "@/lib/donnees/planning";
import { insererPointagesManuels, supprimerPointageManuel } from "@/lib/donnees/pointages";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { bilanPointages } from "@/lib/metier/pointages";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import { libelleService, libelleStatut, resumerStatuts } from "@/lib/textes/statut-pointage";
import { validerPointages } from "@/lib/validation/pointage";
import type { EtatFormulaire } from "@/types";

const textes = TEXTES_EXCEPTIONS.pointages;
const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un pointage manuel`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/**
 * Résultat du pointage d'après le planning, annoncé tout de suite (c'est l'objet du test) :
 * détaillé pour un employé, résumé pour plusieurs.
 */
async function resultatDuTest(donnees: { employeIds: string[]; horodatage: Date; etat: string }): Promise<string> {
  const employes = await groupesDesEmployes(donnees.employeIds);
  const statuts = await evaluerPointages(employes.map((employe) => ({ employeId: employe.id, groupeId: employe.groupeId, horodatage: donnees.horodatage, etat: donnees.etat })));
  if (statuts.length === 1) {
    const service = libelleService(statuts[0]);
    return textes.resultatUn(libelleStatut(statuts[0]), service);
  }
  return textes.resultatPlusieurs(resumerStatuts(statuts));
}

/** Ajoute le même pointage (date, heure, état) à chaque employé coché. */
export async function creerPointagesManuels(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  // Les droits et l'auteur viennent de la session, jamais du formulaire.
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return { message: textes.droits };

  const validation = validerPointages(formulaire, new Date());
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  const { donnees } = validation;

  try {
    if (!(await employesExistent(donnees.employeIds))) return { erreursChamps: { employeIds: textes.erreurs.employeIntrouvable } };
    const enregistres = await insererPointagesManuels(donnees, utilisateur.id);
    // Journal d'audit : qui, combien, quel état. Aucune donnée d'employé.
    console.info("Pointages manuels ajoutés", { utilisateurId: utilisateur.id, etat: donnees.etat, employes: donnees.employeIds.length, enregistres });
    refresh();
    const bilan = bilanPointages(donnees.employeIds.length, enregistres);
    return { succes: { message: `${textes.cree(bilan.enregistres, bilan.doublons)} ${await resultatDuTest(donnees)}`, idSelectionne: null } };
  } catch (erreur) {
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.erreurs.echec };
  }
}

export async function supprimerPointage(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await estSuperAdministrateur())) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.erreurs.introuvable };
  try {
    const existait = await supprimerPointageManuel(id.data);
    refresh();
    if (!existait) return { message: textes.erreurs.introuvable };
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.erreurs.echecSuppression };
  }
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
