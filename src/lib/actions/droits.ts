import "server-only";

import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder, type Page } from "@/lib/metier/droits";

/**
 * Vrai si l'utilisateur connecté est super administrateur. Les droits viennent toujours
 * de la session, jamais du formulaire ; à appeler au début de chaque action serveur.
 */
export async function estSuperAdministrateur(): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin;
}

/** Vrai si l'utilisateur connecté peut voir et gérer cette page (super administrateur ou page accordée). */
export async function peutAccederPage(page: Page): Promise<boolean> {
  return peutAcceder(await obtenirUtilisateurPourEspace(), page);
}
