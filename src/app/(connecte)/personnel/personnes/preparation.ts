import "server-only";

import { LIMITE_INFORMATIONS_EMPLOYE } from "@/lib/constantes";
import { listerDepartements } from "@/lib/donnees/departements";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import type { ChangementPhoto } from "@/lib/donnees/photos-employes";
import { verifierPhoto } from "@/lib/metier/photo";
import { listerPostes } from "@/lib/donnees/postes";
import { listerOptionsSites } from "@/lib/donnees/sites";
import { TEXTES_SITES } from "@/lib/textes/sites";
import { validerInformations, type Information } from "@/lib/metier/employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { AccesPointage } from "@/lib/metier/acces-pointage";
import { accesVersValeurs, lireAccesPointage, validerAccesPointage } from "@/lib/validation/acces-pointage";
import { CHAMPS_EMPLOYE, lireTexte, validerEmploye, type DonneesEmploye } from "@/lib/validation/employe";
import { CHAMPS_ACCES } from "@/lib/validation/acces-pointage";
import { identifiantDepuisMatricule } from "@/lib/metier/pointage-distance";
import type { EtatFormulaireEmploye } from "@/types";

const { erreurs } = TEXTES_PERSONNES;

/** Champ du formulaire en doublon, d'après l'index unique violé en base. */
const CHAMP_PAR_INDEX: Record<string, { champ: string; message: string }> = {
  employes_matricule_idx: { champ: "matricule", message: erreurs.matriculeDejaPris },
  employes_numero_badge_idx: { champ: "numeroBadge", message: erreurs.badgeDejaPris },
  employes_email_idx: { champ: "email", message: erreurs.emailDejaPris },
  employes_piece_identite_idx: { champ: "numeroPieceIdentite", message: erreurs.pieceDejaPrise },
  // Compte de connexion de l'employé : identifiant = matricule.
  utilisateurs_identifiant_idx: { champ: "matricule", message: erreurs.identifiantDejaPris },
  utilisateurs_email_idx: { champ: "matricule", message: erreurs.identifiantDejaPris },
};

/** Lignes « libellé + valeur » saisies, dans l'ordre du formulaire. */
function lireInformations(formulaire: FormData): Information[] {
  const libelles = formulaire.getAll("informationLibelle").map(lireTexte);
  const valeurs = formulaire.getAll("informationValeur").map(lireTexte);
  return libelles.map((libelle, index) => ({ libelle, valeur: valeurs[index] ?? "" }));
}

/**
 * Photo envoyée avec le formulaire : vérifiée par sa signature et sa taille (jamais d'après
 * le nom ou le type annoncé). Sans fichier : on garde la photo actuelle, sauf « retirer ».
 */
async function lirePhoto(formulaire: FormData): Promise<{ ok: true; changement: ChangementPhoto } | { ok: false; erreur: string }> {
  const fichier = formulaire.get("photo");
  if (fichier instanceof File && fichier.size > 0) {
    const octets = Buffer.from(await fichier.arrayBuffer());
    const verification = verifierPhoto(octets);
    if (!verification.ok) return { ok: false, erreur: verification.erreur === "taille" ? erreurs.photoTaille : erreurs.photoFormat };
    return { ok: true, changement: { action: "remplacer", photo: { type: verification.type, octets } } };
  }
  return { ok: true, changement: { action: formulaire.get("retirerPhoto") === "oui" ? "retirer" : "garder" } };
}

type Preparation =
  | {
      ok: true;
      donnees: DonneesEmploye;
      acces: AccesPointage;
      informations: Information[];
      photo: ChangementPhoto;
      /** Remettre le matricule comme mot de passe provisoire du compte de l'employé. */
      reinitialiserMotDePasse: boolean;
      retour: EtatFormulaireEmploye;
    }
  | { ok: false; etat: EtatFormulaireEmploye };

/**
 * Valide tout le formulaire d'employé (création comme modification) : champs, informations
 * supplémentaires, département et poste encore existants. `retour` réaffiche la saisie.
 */
export async function preparerEmploye(formulaire: FormData): Promise<Preparation> {
  const [departements, postes, sites] = await Promise.all([listerDepartements(), listerPostes(), listerOptionsSites()]);
  const valeurs = {
    ...Object.fromEntries(CHAMPS_EMPLOYE.map((nom) => [nom, lireTexte(formulaire.get(nom))])),
    ...accesVersValeurs(lireAccesPointage(formulaire)),
  };
  const saisieInformations = lireInformations(formulaire);
  const retour = { valeurs, informations: saisieInformations };

  const validation = validerEmploye(formulaire);
  const acces = validerAccesPointage(formulaire);
  const informations = validerInformations(saisieInformations);
  const photo = await lirePhoto(formulaire);
  const erreursChamps: Record<string, string | undefined> = validation.ok ? {} : { ...validation.erreursChamps };
  if (!acces.ok) Object.assign(erreursChamps, acces.erreursChamps);
  if (!photo.ok) erreursChamps.photo = photo.erreur;
  for (const [index, erreur] of Object.entries(informations.erreurs)) {
    if (erreur.libelle) erreursChamps[`information_${index}_libelle`] = erreurs.informations[erreur.libelle];
    if (erreur.valeur) erreursChamps[`information_${index}_valeur`] = erreurs.informations[erreur.valeur];
  }
  if (validation.ok) {
    const { departementId, posteId, siteId } = validation.donnees;
    if (siteId && !sites.some((site) => site.valeur === siteId)) {
      erreursChamps.siteId = TEXTES_SITES.champ.introuvable;
    }
    if (!departements.some((departement) => departement.id === departementId)) {
      erreursChamps.departementId = erreurs.departementIntrouvable;
    }
    if (posteId && !postes.some((poste) => poste.id === posteId)) {
      erreursChamps.posteId = erreurs.posteIntrouvable;
    }
    // Le matricule devient l'identifiant de connexion de l'employé autorisé à pointer à distance.
    if (acces.ok && acces.donnees.pointageDistance && !identifiantDepuisMatricule(validation.donnees.matricule)) {
      erreursChamps.matricule = erreurs.matriculeNonIdentifiant;
      erreursChamps[CHAMPS_ACCES.pointageDistance] = erreurs.matriculeNonIdentifiant;
    }
  }

  if (informations.estTropNombreuses) {
    return {
      ok: false,
      etat: { ...retour, erreursChamps, message: erreurs.tropDInformations(LIMITE_INFORMATIONS_EMPLOYE) },
    };
  }
  if (!validation.ok || !acces.ok || !photo.ok || Object.values(erreursChamps).some(Boolean)) {
    return { ok: false, etat: { ...retour, erreursChamps } };
  }
  return {
    ok: true,
    donnees: validation.donnees,
    acces: acces.donnees,
    informations: informations.informations,
    photo: photo.changement,
    reinitialiserMotDePasse: formulaire.get(CHAMPS_ACCES.reinitialiserMotDePasse) === "oui",
    retour,
  };
}

/** Traduit une erreur d'enregistrement en état du formulaire (doublon ou échec général). */
export function etatApresEchec(erreur: unknown, retour: EtatFormulaireEmploye): EtatFormulaireEmploye {
  const doublon = CHAMP_PAR_INDEX[indexEnDoublon(erreur) ?? ""];
  if (doublon) return { ...retour, erreursChamps: { [doublon.champ]: doublon.message } };
  // Journal sans donnée personnelle (ni nom, ni pièce d'identité).
  console.error("Échec de l'enregistrement d'un employé", {
    type: erreur instanceof Error ? erreur.name : "inconnu",
  });
  return { ...retour, message: erreurs.echec };
}
