"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutAccederPage } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_GROUPES } from "@/lib/constantes";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { employesExistent, enregistrerGroupe as enregistrerEnBase, listerGroupes, supprimerGroupeParId } from "@/lib/donnees/groupes";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { validerGroupe } from "@/lib/validation/groupe";
import type { EtatFormulaire } from "@/types";

const textes = TEXTES_PROGRAMME.groupes;
const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un groupe`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Crée un groupe (sans `id`) ou le modifie (avec `id`), membres compris. */
export async function enregistrerGroupe(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("groupes"))) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerGroupe(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };
  if (!(await employesExistent(validation.donnees.membres))) return { message: textes.erreurs.membreIntrouvable };

  try {
    const idGroupe = await enregistrerEnBase(id ? id.data : null, validation.donnees);
    refresh();
    if (!idGroupe) return { message: textes.introuvable };
    await notifier("groupe", id ? "modification" : "creation", validation.donnees.nom, CHEMIN_GROUPES);
    return { succes: { message: id ? textes.modifie : textes.cree, idSelectionne: idGroupe } };
  } catch (erreur) {
    if (indexEnDoublon(erreur) !== null) return { erreursChamps: { nom: textes.erreurs.nomDejaPris } };
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.echec };
  }
}

export async function supprimerGroupe(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("groupes"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  let nom: string | null = null;
  try {
    nom = (await listerGroupes()).find((element) => element.id === id.data)?.nom ?? null;
    await supprimerGroupeParId(id.data);
  } catch (erreur) {
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  await notifier("groupe", "suppression", nom, CHEMIN_GROUPES);
  refresh();
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
