"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CHEMIN_CONNEXION, PARAMETRE_MOT_DE_PASSE_CHANGE } from "@/lib/constantes";
import { notifier } from "@/lib/actions/notifier";
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

  const entetes = await headers();
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: validation.donnees.actuel,
        newPassword: validation.donnees.nouveau,
        revokeOtherSessions: false,
      },
      headers: entetes,
    });
    // Déconnecte les autres appareils, qui connaissaient peut-être l'ancien mot de passe.
    await auth.api.revokeOtherSessions({ headers: entetes });
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
  await notifier("mot_de_passe", "modification", null);
  // Puis retour à la connexion : on se reconnecte avec le nouveau mot de passe, comme après
  // la création du premier compte. La fermeture de session ne doit pas bloquer ce retour.
  try {
    await auth.api.signOut({ headers: entetes });
  } catch (erreur) {
    console.error("Échec de la déconnexion après changement de mot de passe", {
      type: erreur instanceof Error ? erreur.name : "inconnu",
    });
  }
  redirect(`${CHEMIN_CONNEXION}?${PARAMETRE_MOT_DE_PASSE_CHANGE}=1`);
}
