import "server-only";

import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";

/**
 * Vrai si l'utilisateur connecté est super administrateur. Les droits viennent toujours
 * de la session, jamais du formulaire ; à appeler au début de chaque action serveur.
 */
export async function estSuperAdministrateur(): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin;
}
