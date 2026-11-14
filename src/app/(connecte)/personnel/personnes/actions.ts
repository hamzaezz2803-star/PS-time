"use server";

import { refresh } from "next/cache";
import { LIMITE_INFORMATIONS_EMPLOYE } from "@/lib/constantes";
import { listerDepartements } from "@/lib/donnees/departements";
import { insererEmploye } from "@/lib/donnees/employes";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { listerPostes } from "@/lib/donnees/postes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { validerInformations, type Information } from "@/lib/metier/employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { CHAMPS_EMPLOYE, lireTexte, validerEmploye } from "@/lib/validation/employe";
import type { EtatFormulaireEmploye } from "@/types";

const { erreurs, formulaire: textes } = TEXTES_PERSONNES;

/** Champ du formulaire en doublon, d'après l'index unique violé en base. */
const CHAMP_PAR_INDEX: Record<string, { champ: string; message: string }> = {
  employes_matricule_idx: { champ: "matricule", message: erreurs.matriculeDejaPris },
  employes_numero_badge_idx: { champ: "numeroBadge", message: erreurs.badgeDejaPris },
  employes_email_idx: { champ: "email", message: erreurs.emailDejaPris },
  employes_piece_identite_idx: { champ: "numeroPieceIdentite", message: erreurs.pieceDejaPrise },
};

/** Les droits viennent toujours de la session. Pour l'instant : super administrateur uniquement. */
async function aLesDroits(): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin;
}

/** Lignes « libellé + valeur » saisies, dans l'ordre du formulaire. */
function lireInformations(formulaire: FormData): Information[] {
  const libelles = formulaire.getAll("informationLibelle").map(lireTexte);
  const valeurs = formulaire.getAll("informationValeur").map(lireTexte);
  return libelles.map((libelle, index) => ({ libelle, valeur: valeurs[index] ?? "" }));
}

/** Erreurs des informations, rangées sous les noms de champs du formulaire. */
function erreursInformations(formulaire: FormData) {
  const saisie = lireInformations(formulaire);
  const resultat = validerInformations(saisie);
  const erreursChamps: Record<string, string> = {};
  for (const [index, erreur] of Object.entries(resultat.erreurs)) {
    if (erreur.libelle) erreursChamps[`information_${index}_libelle`] = erreurs.informations[erreur.libelle];
    if (erreur.valeur) erreursChamps[`information_${index}_valeur`] = erreurs.informations[erreur.valeur];
  }
  return { saisie, resultat, erreursChamps };
}

export async function creerEmploye(
  _etatPrecedent: EtatFormulaireEmploye,
  formulaire: FormData,
): Promise<EtatFormulaireEmploye> {
  if (!(await aLesDroits())) return { message: erreurs.droits };

  const [departements, postes] = await Promise.all([listerDepartements(), listerPostes()]);
  const valeurs = Object.fromEntries(CHAMPS_EMPLOYE.map((nom) => [nom, lireTexte(formulaire.get(nom))]));
  const validation = validerEmploye(formulaire);
  const informations = erreursInformations(formulaire);
  const retour = { valeurs, informations: informations.saisie };

  const erreursChamps: Record<string, string | undefined> = {
    ...(validation.ok ? {} : validation.erreursChamps),
    ...informations.erreursChamps,
  };
  if (validation.ok) {
    const { departementId, posteId } = validation.donnees;
    if (!departements.some((departement) => departement.id === departementId)) {
      erreursChamps.departementId = erreurs.departementIntrouvable;
    }
    if (posteId && !postes.some((poste) => poste.id === posteId)) {
      erreursChamps.posteId = erreurs.posteIntrouvable;
    }
  }
  if (informations.resultat.estTropNombreuses) {
    return { ...retour, erreursChamps, message: erreurs.tropDInformations(LIMITE_INFORMATIONS_EMPLOYE) };
  }
  if (!validation.ok || Object.values(erreursChamps).some(Boolean)) {
    return { ...retour, erreursChamps };
  }

  try {
    await insererEmploye(validation.donnees, informations.resultat.informations);
  } catch (erreur) {
    const doublon = CHAMP_PAR_INDEX[indexEnDoublon(erreur) ?? ""];
    if (doublon) return { ...retour, erreursChamps: { [doublon.champ]: doublon.message } };
    // Journal sans donnée personnelle (ni nom, ni pièce d'identité).
    console.error("Échec de la création d'un employé", {
      type: erreur instanceof Error ? erreur.name : "inconnu",
    });
    return { ...retour, message: erreurs.echec };
  }

  refresh();
  const { prenom, nom } = validation.donnees;
  return { succes: textes.cree(`${prenom} ${nom}`) };
}
