"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_COMPTEURS } from "@/lib/constantes";
import { changerEtatCompteur as changerEtatEnBase, enregistrerCompteur as enregistrerEnBase, listerVersions, supprimerCompteurParId } from "@/lib/donnees/compteurs";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutGerer } from "@/lib/metier/droits";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { validerCompteur } from "@/lib/validation/compteur";
import type { EtatFormulaire, VersionCompteur } from "@/types";

const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un compteur`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Compte connecté s'il a le module Présence, sinon null. Les droits viennent toujours de la session. */
async function auteurAutorise() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return peutGerer(utilisateur, "presence") ? utilisateur : null;
}

/** Crée un compteur (sans `id`) ou le modifie ; une nouvelle version est créée si la formule, l'unité ou les périodicités changent. */
export async function enregistrerCompteur(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const auteur = await auteurAutorise();
  if (!auteur) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerCompteur(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    const resultat = await enregistrerEnBase(id ? id.data : null, validation.donnees, auteur.id);
    if (!resultat.ok) {
      if (resultat.erreur === "code") return { erreursChamps: { code: textes.erreurs.codeDejaPris } };
      if (resultat.erreur === "libelle") return { erreursChamps: { libelle: textes.erreurs.libelleDejaPris } };
      refresh();
      return { message: textes.introuvable };
    }
    refresh();
    await notifier("compteur", id ? "modification" : "creation", validation.donnees.libelle, CHEMIN_COMPTEURS);
    const message = !id ? textes.cree : resultat.version > 1 ? textes.modifieVersion(resultat.version) : textes.modifie;
    return { succes: { message, idSelectionne: resultat.id } };
  } catch (erreur) {
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.echec };
  }
}

/** Active ou désactive un compteur (on ne supprime pas un compteur : ses versions restent l'historique). */
export async function changerEtatCompteur(id: string, estActif: boolean): Promise<EtatFormulaire> {
  const auteur = await auteurAutorise();
  if (!auteur) return { message: textes.droits };
  const analyse = identifiant.safeParse(id);
  if (!analyse.success || typeof estActif !== "boolean") return { message: textes.introuvable };

  try {
    const trouve = await changerEtatEnBase(analyse.data, estActif, auteur.id);
    refresh();
    if (!trouve) return { message: textes.introuvable };
    await notifier("compteur", "modification", estActif ? textes.actif : textes.inactif, CHEMIN_COMPTEURS);
    return { succes: { message: estActif ? textes.active : textes.desactive, idSelectionne: analyse.data } };
  } catch (erreur) {
    journaliserEchec("du changement d'état", erreur);
    return { message: textes.echec };
  }
}

/** Supprime un compteur et son historique de versions (après confirmation dans la fenêtre). */
export async function supprimerCompteur(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const auteur = await auteurAutorise();
  if (!auteur) return { message: textes.droits };
  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };

  let libelle: string | null;
  try {
    libelle = await supprimerCompteurParId(id.data);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  refresh();
  if (!libelle) return { message: textes.introuvable };
  await notifier("compteur", "suppression", libelle, CHEMIN_COMPTEURS);
  return { succes: { message: textes.supprime, idSelectionne: null } };
}

/** Historique des versions d'un compteur (fenêtre de modification). */
export async function chargerVersionsCompteur(id: string): Promise<{ ok: true; versions: VersionCompteur[] } | { ok: false }> {
  if (!(await auteurAutorise())) return { ok: false };
  const analyse = identifiant.safeParse(id);
  if (!analyse.success) return { ok: false };
  try {
    return { ok: true, versions: await listerVersions(analyse.data) };
  } catch (erreur) {
    journaliserEchec("du chargement des versions", erreur);
    return { ok: false };
  }
}
