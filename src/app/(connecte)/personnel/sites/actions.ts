"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { peutAccederPage } from "@/lib/actions/droits";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_SITES } from "@/lib/constantes";
import { estEncoreReference, indexEnDoublon } from "@/lib/donnees/erreurs";
import { enregistrerSite as enregistrerEnBase, listerOptionsSites, supprimerSiteParId } from "@/lib/donnees/sites";
import { TEXTES_SITES as textes } from "@/lib/textes/sites";
import { validerSite } from "@/lib/validation/site";
import type { EtatFormulaire } from "@/types";

const identifiant = z.uuid();

function journaliserEchec(operation: string, erreur: unknown) {
  console.error(`Échec ${operation} d'un site`, { type: erreur instanceof Error ? erreur.name : "inconnu" });
}

/** Crée un site (sans `id`) ou le modifie (avec `id`). */
export async function enregistrerSite(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("sites"))) return { message: textes.droits };

  const id = formulaire.get("id") ? identifiant.safeParse(formulaire.get("id")) : null;
  if (id && !id.success) return { message: textes.introuvable };
  const validation = validerSite(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    const idSite = await enregistrerEnBase(id ? id.data : null, validation.donnees);
    refresh();
    if (!idSite) return { message: textes.introuvable };
    await notifier("site", id ? "modification" : "creation", validation.donnees.nom, CHEMIN_SITES);
    return { succes: { message: id ? textes.modifie : textes.cree, idSelectionne: idSite } };
  } catch (erreur) {
    if (indexEnDoublon(erreur) !== null) return { erreursChamps: { nom: textes.erreurs.nomDejaPris } };
    journaliserEchec("de l'enregistrement", erreur);
    return { message: textes.echec };
  }
}

export async function supprimerSite(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  if (!(await peutAccederPage("sites"))) return { message: textes.droits };

  const id = identifiant.safeParse(formulaire.get("id"));
  if (!id.success) return { message: textes.introuvable };
  let nom: string | null = null;
  try {
    nom = (await listerOptionsSites()).find((site) => site.valeur === id.data)?.libelle ?? null;
    await supprimerSiteParId(id.data);
  } catch (erreur) {
    // Clé étrangère « restrict » : des départements, postes ou employés y sont rattachés.
    if (estEncoreReference(erreur)) return { message: textes.erreurs.encoreUtilise };
    journaliserEchec("de la suppression", erreur);
    return { message: textes.echec };
  }
  await notifier("site", "suppression", nom, CHEMIN_SITES);
  refresh();
  return { succes: { message: textes.supprime, idSelectionne: null } };
}
