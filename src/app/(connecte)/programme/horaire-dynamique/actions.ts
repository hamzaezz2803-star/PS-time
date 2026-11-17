"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutGererModule } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_HORAIRE_DYNAMIQUE, LIMITE_EMPLOYES_SELECTION } from "@/lib/constantes";
import {
  changerEtatRegle as changerEtatEnBase,
  enregistrerEmployesHoraireDynamique,
  enregistrerRegle as enregistrerEnBase,
  supprimerRegleParId,
  type ResultatRegle,
} from "@/lib/donnees/horaire-dynamique";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";
import { validerRegleHoraire } from "@/lib/validation/regle-horaire";
import type { EtatFormulaire } from "@/types";

const identifiant = z.uuid();
const listeEmployes = z.array(z.uuid()).max(LIMITE_EMPLOYES_SELECTION);

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} (horaire dynamique)`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Message à afficher pour un refus de la base de données (règle introuvable, profil, chevauchement). */
function messageRefus(erreur: Exclude<ResultatRegle, { ok: true }>["erreur"]): EtatFormulaire {
  if (erreur === "chevauchement") return { erreursChamps: { debut: textes.erreurs.chevauchement } };
  if (erreur === "profil") return { erreursChamps: { profilId: textes.erreurs.profilIntrouvable } };
  return { message: textes.introuvable };
}

/** Crée une règle (sans `id`) ou la modifie (avec `id`), sans chevauchement avec une règle active. */
export async function enregistrerRegle(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerRegleHoraire(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    const resultat = await enregistrerEnBase(id ? id.data : null, validation.donnees);
    if (!resultat.ok) {
      if (resultat.erreur === "introuvable") refresh();
      return messageRefus(resultat.erreur);
    }
    refresh();
    const { debut, fin } = validation.donnees;
    await notifier("regle_horaire", id ? "modification" : "creation", textes.fenetre(minutesVersHeure(debut), minutesVersHeure(fin)), CHEMIN_HORAIRE_DYNAMIQUE);
    return { succes: { message: id ? textes.modifie : textes.cree, idSelectionne: resultat.id } };
  } catch (erreur) {
    journaliserEchec("de l'enregistrement d'une règle", erreur);
    return { message: textes.echec };
  }
}

/** Active ou désactive une règle (interrupteur de la liste). */
export async function changerEtatRegle(id: string, estActif: boolean): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };
  const analyse = identifiant.safeParse(id);
  if (!analyse.success || typeof estActif !== "boolean") return { message: textes.introuvable };

  try {
    const resultat = await changerEtatEnBase(analyse.data, estActif);
    refresh();
    if (!resultat.ok) return { message: resultat.erreur === "chevauchement" ? textes.erreurs.chevauchement : textes.introuvable };
    await notifier("regle_horaire", "modification", estActif ? textes.actif : textes.inactif, CHEMIN_HORAIRE_DYNAMIQUE);
    return { succes: { message: estActif ? textes.active : textes.desactivee, idSelectionne: analyse.data } };
  } catch (erreur) {
    journaliserEchec("du changement d'état d'une règle", erreur);
    return { message: textes.echec };
  }
}

export async function supprimerRegle(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  try {
    await supprimerRegleParId(id.data);
  } catch (erreur) {
    journaliserEchec("de la suppression d'une règle", erreur);
    return { message: textes.echec };
  }
  refresh();
  await notifier("regle_horaire", "suppression", null, CHEMIN_HORAIRE_DYNAMIQUE);
  return { succes: { message: textes.supprime, idSelectionne: null } };
}

/** Fixe la liste des employés en horaire dynamique (cases cochées) ; les autres gardent leur rotation. */
export async function enregistrerEmployes(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutGererModule("planning"))) return { message: textes.droits };

  const analyse = listeEmployes.safeParse(formulaire.getAll("employes"));
  if (!analyse.success) return { message: textes.erreurs.employesIntrouvables };
  const ids = [...new Set(analyse.data)];
  try {
    if (!(await enregistrerEmployesHoraireDynamique(ids))) return { message: textes.erreurs.employesIntrouvables };
  } catch (erreur) {
    journaliserEchec("de l'enregistrement des employés", erreur);
    return { message: textes.echec };
  }
  refresh();
  const message = textes.employesEnregistres(ids.length);
  await notifier("horaire_dynamique", "modification", message, CHEMIN_HORAIRE_DYNAMIQUE);
  return { succes: { message, idSelectionne: null } };
}
