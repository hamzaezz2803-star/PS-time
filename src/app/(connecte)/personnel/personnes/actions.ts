"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  insererEmploye,
  mettreAJourEmploye,
  obtenirEmploye,
  supprimerEmployeParId,
} from "@/lib/donnees/employes";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_PERSONNES } from "@/lib/constantes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { EmployeDetail, EtatFormulaireEmploye, Resultat } from "@/types";
import { etatApresEchec, preparerEmploye } from "./preparation";

const { erreurs, formulaire: textes, modification, suppression } = TEXTES_PERSONNES;

/** Les droits viennent toujours de la session. Données personnelles : super administrateur uniquement. */
async function aLesDroits(): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return peutAcceder(utilisateur, "personnes");
}

const identifiantEmploye = z.uuid();

export async function creerEmploye(
  _etatPrecedent: EtatFormulaireEmploye,
  formulaire: FormData,
): Promise<EtatFormulaireEmploye> {
  if (!(await aLesDroits())) return { message: erreurs.droits };

  const preparation = await preparerEmploye(formulaire);
  if (!preparation.ok) return preparation.etat;

  try {
    await insererEmploye(preparation.donnees, preparation.acces, preparation.informations, preparation.photo);
  } catch (erreur) {
    return etatApresEchec(erreur, preparation.retour);
  }

  refresh();
  const { prenom, nom } = preparation.donnees;
  await notifier("employe", "creation", `${prenom} ${nom}`, CHEMIN_PERSONNES);
  return { succes: textes.cree(`${prenom} ${nom}`) };
}

/** Modifie l'employé dont l'identifiant est dans le champ caché `id`. */
export async function modifierEmploye(
  _etatPrecedent: EtatFormulaireEmploye,
  formulaire: FormData,
): Promise<EtatFormulaireEmploye> {
  if (!(await aLesDroits())) return { message: erreurs.droits };

  const id = identifiantEmploye.safeParse(formulaire.get("id"));
  if (!id.success) return { message: erreurs.introuvable };

  const preparation = await preparerEmploye(formulaire);
  if (!preparation.ok) return preparation.etat;

  try {
    const existe = await mettreAJourEmploye(
      id.data,
      preparation.donnees,
      preparation.acces,
      preparation.informations,
      preparation.photo,
      preparation.reinitialiserMotDePasse,
    );
    if (!existe) {
      refresh();
      return { ...preparation.retour, message: erreurs.introuvable };
    }
  } catch (erreur) {
    return etatApresEchec(erreur, preparation.retour);
  }

  refresh();
  const { prenom, nom } = preparation.donnees;
  await notifier("employe", "modification", `${prenom} ${nom}`, CHEMIN_PERSONNES);
  return { succes: modification.modifie(`${prenom} ${nom}`) };
}

/** Fiche complète d'un employé, pour l'afficher ou la modifier. */
export async function lireEmploye(id: string): Promise<Resultat<EmployeDetail>> {
  if (!(await aLesDroits())) return { ok: false, erreur: erreurs.droits };

  const analyse = identifiantEmploye.safeParse(id);
  if (!analyse.success) return { ok: false, erreur: erreurs.introuvable };
  try {
    const employe = await obtenirEmploye(analyse.data);
    return employe ? { ok: true, donnees: employe } : { ok: false, erreur: erreurs.introuvable };
  } catch {
    return { ok: false, erreur: erreurs.echec };
  }
}

export async function supprimerEmploye(id: string): Promise<Resultat<{ message: string }>> {
  if (!(await aLesDroits())) return { ok: false, erreur: erreurs.droits };

  const analyse = identifiantEmploye.safeParse(id);
  if (!analyse.success) return { ok: false, erreur: erreurs.introuvable };
  const employe = await obtenirEmploye(analyse.data);
  if (!employe) {
    refresh();
    return { ok: false, erreur: erreurs.introuvable };
  }

  try {
    await supprimerEmployeParId(employe.id);
  } catch (erreur) {
    console.error("Échec de la suppression d'un employé", {
      type: erreur instanceof Error ? erreur.name : "inconnu",
    });
    return { ok: false, erreur: erreurs.echec };
  }

  await notifier("employe", "suppression", `${employe.prenom} ${employe.nom}`, CHEMIN_PERSONNES);
  refresh();
  return { ok: true, donnees: { message: suppression.supprime(`${employe.prenom} ${employe.nom}`) } };
}
