"use server";

import { authentifier } from "@/lib/donnees/authentification";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { validerIdentifiants } from "@/lib/validation/connexion";
import type { EtatConnexion } from "@/types";

const { erreurs } = TEXTES_CONNEXION;

export async function connecter(
  _etatPrecedent: EtatConnexion,
  formulaire: FormData,
): Promise<EtatConnexion> {
  const emailSaisi = formulaire.get("email");
  const validation = validerIdentifiants(emailSaisi, formulaire.get("motDePasse"));
  const email = typeof emailSaisi === "string" ? emailSaisi : "";

  if (!validation.ok) {
    return { email, erreursChamps: validation.erreursChamps };
  }

  const resultat = await authentifier(validation.donnees);

  if (!resultat.ok) {
    const message =
      resultat.erreur === "identifiants_invalides"
        ? erreurs.identifiantsInvalides
        : erreurs.serviceIndisponible;
    return { email, message };
  }

  // Création de la session et redirection vers l'espace : à brancher avec le service d'authentification.
  return { email };
}
