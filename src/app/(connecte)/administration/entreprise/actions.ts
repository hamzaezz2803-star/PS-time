"use server";

import { refresh, updateTag } from "next/cache";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_ENTREPRISE, LOGO_ENTREPRISE_TAILLE_MAX_OCTETS } from "@/lib/constantes";
import { ETIQUETTE_ENTREPRISE, enregistrerEntreprise } from "@/lib/donnees/entreprise";
import type { ChangementPhoto } from "@/lib/donnees/photos-employes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { verifierPhoto } from "@/lib/metier/photo";
import { TEXTES_ENTREPRISE as textes } from "@/lib/textes/entreprise";
import { validerEntreprise } from "@/lib/validation/entreprise";
import type { EtatFormulaire } from "@/types";

/**
 * Logo envoyé avec le formulaire : vérifié par sa signature et sa taille (jamais d'après le nom
 * ou le type annoncé). Sans fichier : on garde le logo actuel, sauf « retirer ».
 */
async function lireLogo(formulaire: FormData): Promise<{ ok: true; changement: ChangementPhoto } | { ok: false; erreur: string }> {
  const fichier = formulaire.get("logo");
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > LOGO_ENTREPRISE_TAILLE_MAX_OCTETS) return { ok: false, erreur: textes.erreurs.logoTaille };
    const octets = Buffer.from(await fichier.arrayBuffer());
    const verification = verifierPhoto(octets, LOGO_ENTREPRISE_TAILLE_MAX_OCTETS);
    if (!verification.ok) return { ok: false, erreur: verification.erreur === "taille" ? textes.erreurs.logoTaille : textes.erreurs.logoFormat };
    return { ok: true, changement: { action: "remplacer", photo: { type: verification.type, octets } } };
  }
  return { ok: true, changement: { action: formulaire.get("retirerLogo") === "oui" ? "retirer" : "garder" } };
}

/** Enregistre les informations et le logo de l'entreprise (super administrateur seulement, lu dans la session). */
export async function modifierEntreprise(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const auteur = await obtenirUtilisateurPourEspace();
  if (!auteur.estSuperAdmin) return { message: textes.droits };

  const validation = validerEntreprise(formulaire);
  const logo = await lireLogo(formulaire);
  if (!validation.ok || !logo.ok) {
    return { erreursChamps: { ...(validation.ok ? {} : validation.erreursChamps), ...(logo.ok ? {} : { logo: logo.erreur }) } };
  }

  try {
    await enregistrerEntreprise(validation.donnees, logo.changement, auteur.id);
  } catch (erreur) {
    console.error("Échec de l'enregistrement des informations de l'entreprise", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { message: textes.echec };
  }
  updateTag(ETIQUETTE_ENTREPRISE);
  console.info("Informations de l'entreprise modifiées", { par: auteur.identifiant, logo: logo.changement.action });
  await notifier("entreprise", "modification", textes.libelleNotification(validation.donnees.nom, logo.changement.action === "remplacer"), CHEMIN_ENTREPRISE);
  refresh();
  return { succes: { message: textes.enregistre, idSelectionne: null } };
}
