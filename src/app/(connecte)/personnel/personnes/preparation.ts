import "server-only";

import { LIMITE_INFORMATIONS_EMPLOYE } from "@/lib/constantes";
import { listerDepartements } from "@/lib/donnees/departements";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { listerPostes } from "@/lib/donnees/postes";
import { validerInformations, type Information } from "@/lib/metier/employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { CHAMPS_EMPLOYE, lireTexte, validerEmploye, type DonneesEmploye } from "@/lib/validation/employe";
import type { EtatFormulaireEmploye } from "@/types";

const { erreurs } = TEXTES_PERSONNES;

/** Champ du formulaire en doublon, d'après l'index unique violé en base. */
const CHAMP_PAR_INDEX: Record<string, { champ: string; message: string }> = {
  employes_matricule_idx: { champ: "matricule", message: erreurs.matriculeDejaPris },
  employes_numero_badge_idx: { champ: "numeroBadge", message: erreurs.badgeDejaPris },
  employes_email_idx: { champ: "email", message: erreurs.emailDejaPris },
  employes_piece_identite_idx: { champ: "numeroPieceIdentite", message: erreurs.pieceDejaPrise },
};

/** Lignes « libellé + valeur » saisies, dans l'ordre du formulaire. */
function lireInformations(formulaire: FormData): Information[] {
  const libelles = formulaire.getAll("informationLibelle").map(lireTexte);
  const valeurs = formulaire.getAll("informationValeur").map(lireTexte);
  return libelles.map((libelle, index) => ({ libelle, valeur: valeurs[index] ?? "" }));
}

type Preparation =
  | { ok: true; donnees: DonneesEmploye; informations: Information[]; retour: EtatFormulaireEmploye }
  | { ok: false; etat: EtatFormulaireEmploye };

/**
 * Valide tout le formulaire d'employé (création comme modification) : champs, informations
 * supplémentaires, département et poste encore existants. `retour` réaffiche la saisie.
 */
export async function preparerEmploye(formulaire: FormData): Promise<Preparation> {
  const [departements, postes] = await Promise.all([listerDepartements(), listerPostes()]);
  const valeurs = Object.fromEntries(CHAMPS_EMPLOYE.map((nom) => [nom, lireTexte(formulaire.get(nom))]));
  const saisieInformations = lireInformations(formulaire);
  const retour = { valeurs, informations: saisieInformations };

  const validation = validerEmploye(formulaire);
  const informations = validerInformations(saisieInformations);
  const erreursChamps: Record<string, string | undefined> = validation.ok ? {} : { ...validation.erreursChamps };
  for (const [index, erreur] of Object.entries(informations.erreurs)) {
    if (erreur.libelle) erreursChamps[`information_${index}_libelle`] = erreurs.informations[erreur.libelle];
    if (erreur.valeur) erreursChamps[`information_${index}_valeur`] = erreurs.informations[erreur.valeur];
  }
  if (validation.ok) {
    const { departementId, posteId } = validation.donnees;
    if (!departements.some((departement) => departement.id === departementId)) {
      erreursChamps.departementId = erreurs.departementIntrouvable;
    }
    if (posteId && !postes.some((poste) => poste.id === posteId)) {
      erreursChamps.posteId = erreurs.posteIntrouvable;
    }
  }

  if (informations.estTropNombreuses) {
    return {
      ok: false,
      etat: { ...retour, erreursChamps, message: erreurs.tropDInformations(LIMITE_INFORMATIONS_EMPLOYE) },
    };
  }
  if (!validation.ok || Object.values(erreursChamps).some(Boolean)) {
    return { ok: false, etat: { ...retour, erreursChamps } };
  }
  return { ok: true, donnees: validation.donnees, informations: informations.informations, retour };
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
