"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CHEMIN_CONNEXION } from "@/lib/constantes";
import { enregistrerTrace } from "@/lib/actions/notifier";
import { auth } from "@/lib/donnees/authentification";

/** Supprime la session en base et le cookie, la note dans l'historique, puis renvoie vers la connexion. */
export async function deconnecter() {
  try {
    const entetes = await headers();
    const session = await auth.api.getSession({ headers: entetes });
    await auth.api.signOut({ headers: entetes });
    if (session) {
      const { id, name, username } = session.user;
      await enregistrerTrace({ action: "deconnexion", objet: "session", libelle: null, lien: null, auteur: { id, nom: name, identifiant: username ?? null } });
    }
  } catch {
    // Session déjà expirée ou absente : rien à supprimer.
  }
  redirect(CHEMIN_CONNEXION);
}
