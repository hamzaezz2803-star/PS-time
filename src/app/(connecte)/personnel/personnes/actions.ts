"use server";

import { refresh } from "next/cache";
import { LIMITE_CHAMPS_PERSONNALISES } from "@/lib/constantes";
import {
  compterChampsPersonnalises,
  insererChampPersonnalise,
  listerChampsPersonnalises,
} from "@/lib/donnees/champs-personnalises";
import { listerDepartements } from "@/lib/donnees/departements";
import { insererEmploye, type ValeurChamp } from "@/lib/donnees/employes";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { listerPostes } from "@/lib/donnees/postes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { validerValeurChamp, type ErreurValeurChamp } from "@/lib/metier/employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import {
  CHAMPS_EMPLOYE,
  lireTexte,
  validerEmploye,
  validerNouveauChamp,
} from "@/lib/validation/employe";
import type { ChampPersonnalise, EtatFormulaireEmploye, Resultat } from "@/types";

const { erreurs, formulaire: textes, champsFacultatifs } = TEXTES_PERSONNES;

const MESSAGES_VALEUR: Record<ErreurValeurChamp, string> = {
  tropLong: erreurs.valeurTropLongue,
  nombre: erreurs.valeurNombre,
  date: erreurs.valeurDate,
};

/** Les droits viennent toujours de la session. Pour l'instant : super administrateur uniquement. */
async function aLesDroits(): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin;
}

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation}`, {
    type: erreur instanceof Error ? erreur.name : "inconnu",
  });
}

const nomChampFormulaire = (champ: ChampPersonnalise) => `champ_${champ.id}`;

/** Saisie renvoyée au formulaire pour la réafficher après une erreur. */
function lireSaisie(formulaire: FormData, champs: ChampPersonnalise[]): Record<string, string> {
  const noms = [...CHAMPS_EMPLOYE, ...champs.map(nomChampFormulaire)];
  return Object.fromEntries(noms.map((nom) => [nom, lireTexte(formulaire.get(nom))]));
}

/** Valide les champs facultatifs ; les valeurs vides ne sont pas enregistrées. */
function validerChampsFacultatifs(formulaire: FormData, champs: ChampPersonnalise[]) {
  const valeurs: ValeurChamp[] = [];
  const erreursChamps: Record<string, string> = {};
  for (const champ of champs) {
    const nom = nomChampFormulaire(champ);
    const resultat = validerValeurChamp(champ.type, lireTexte(formulaire.get(nom)));
    if (!resultat.ok) erreursChamps[nom] = MESSAGES_VALEUR[resultat.erreur];
    else if (resultat.valeur !== null) valeurs.push({ champId: champ.id, valeur: resultat.valeur });
  }
  return { valeurs, erreursChamps };
}

export async function creerEmploye(
  _etatPrecedent: EtatFormulaireEmploye,
  formulaire: FormData,
): Promise<EtatFormulaireEmploye> {
  if (!(await aLesDroits())) return { message: erreurs.droits };

  const [champs, departements, postes] = await Promise.all([
    listerChampsPersonnalises(),
    listerDepartements(),
    listerPostes(),
  ]);
  const valeurs = lireSaisie(formulaire, champs);
  const validation = validerEmploye(formulaire);
  const facultatifs = validerChampsFacultatifs(formulaire, champs);

  const erreursChamps = {
    ...(validation.ok ? {} : validation.erreursChamps),
    ...facultatifs.erreursChamps,
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
  if (!validation.ok || Object.values(erreursChamps).some(Boolean)) {
    return { erreursChamps, valeurs };
  }

  try {
    await insererEmploye(validation.donnees, facultatifs.valeurs);
  } catch (erreur) {
    const index = indexEnDoublon(erreur);
    if (index === "employes_matricule_idx") {
      return { erreursChamps: { matricule: erreurs.matriculeDejaPris }, valeurs };
    }
    if (index === "employes_email_idx") {
      return { erreursChamps: { email: erreurs.emailDejaPris }, valeurs };
    }
    journaliserEchec("de la création d'un employé", erreur);
    return { message: erreurs.echec, valeurs };
  }

  refresh();
  const { prenom, nom } = validation.donnees;
  return { succes: textes.cree(`${prenom} ${nom}`) };
}

/** Crée un champ facultatif, aussitôt proposé dans le formulaire de tous les employés. */
export async function ajouterChampPersonnalise(
  saisie: unknown,
): Promise<Resultat<ChampPersonnalise & { message: string }>> {
  if (!(await aLesDroits())) return { ok: false, erreur: erreurs.droits };

  const validation = validerNouveauChamp(saisie);
  if (!validation.ok) return validation;
  const { nom, type } = validation.donnees;

  if ((await compterChampsPersonnalises()) >= LIMITE_CHAMPS_PERSONNALISES) {
    return { ok: false, erreur: erreurs.limiteChamps(LIMITE_CHAMPS_PERSONNALISES) };
  }

  try {
    const champ = await insererChampPersonnalise(nom, type);
    refresh();
    return { ok: true, donnees: { ...champ, message: champsFacultatifs.ajoute(nom) } };
  } catch (erreur) {
    if (indexEnDoublon(erreur) !== null) return { ok: false, erreur: erreurs.nomChampDejaPris };
    journaliserEchec("de la création d'un champ facultatif", erreur);
    return { ok: false, erreur: erreurs.echec };
  }
}
