"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CHEMIN_ESPACE } from "@/lib/constantes";
import { auth } from "@/lib/donnees/authentification";
import { obtenirUtilisateurConnecte } from "@/lib/donnees/session";
import { marquerMotDePasseChange } from "@/lib/donnees/utilisateurs";
import { TEXTES_MOT_DE_PASSE } from "@/lib/textes/espace";
import { validerChangementMotDePasse } from "@/lib/validation/mot-de-passe";
import type { EtatChangementMotDePasse } from "@/types";

const { erreurs } = TEXTES_MOT_DE_PASSE;

export async function changerMotDePasse(
  _etatPrecedent: EtatChangementMotDePasse,
  formulaire: FormData,
): Promise<EtatChangementMotDePasse> {
  // L'identité vient toujours de la session, jamais du formulaire.
  const utilisateur = await obtenirUtilisateurConnecte();

  const validation = validerChangementMotDePasse(formulaire);
  if (!validation.ok) return { erreursChamps: validation.erreursChamps };

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: validation.donnees.actuel,
        newPassword: validation.donnees.nouveau,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (erreur) {
    if (erreur instanceof APIError && erreur.body?.code === "INVALID_PASSWORD") {
      return { erreursChamps: { actuel: erreurs.actuelIncorrect } };
    }
    console.error("Échec du changement de mot de passe", {
      type: erreur instanceof Error ? erreur.name : "inconnu",
    });
    return { message: erreurs.echec };
  }

  await marquerMotDePasseChange(utilisateur.id);
  redirect(CHEMIN_ESPACE);
}
