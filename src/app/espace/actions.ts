"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CHEMIN_CONNEXION } from "@/lib/constantes";
import { auth } from "@/lib/donnees/authentification";

/** Supprime la session en base et le cookie, puis renvoie vers la connexion. */
export async function deconnecter() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Session déjà expirée ou absente : rien à supprimer.
  }
  redirect(CHEMIN_CONNEXION);
}
