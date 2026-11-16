import "server-only";

import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutGerer, type Module } from "@/lib/metier/droits";

/**
 * Vrai si l'utilisateur connecté est super administrateur. Les droits viennent toujours
 * de la session, jamais du formulaire ; à appeler au début de chaque action serveur.
 */
export async function estSuperAdministrateur(): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin;
}

/** Vrai si l'utilisateur connecté peut gérer ce module (super administrateur ou module accordé). */
export async function peutGererModule(module: Module): Promise<boolean> {
  return peutGerer(await obtenirUtilisateurPourEspace(), module);
}
