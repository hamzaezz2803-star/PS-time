import "server-only";

import { obtenirUtilisateurConnecte, type UtilisateurConnecte } from "./session";

/**
 * Contrôle commun aux routes d'export et d'import : requête envoyée depuis l'application
 * elle-même (en-tête Origin), session valide, super administrateur au mot de passe définitif.
 * Renvoie null si l'accès est refusé.
 */
export async function autoriserSauvegarde(requete: Request): Promise<UtilisateurConnecte | null> {
  const origine = requete.headers.get("origin");
  const hote = requete.headers.get("x-forwarded-host") ?? requete.headers.get("host");
  if (!origine || !hote || URL.parse(origine)?.host !== hote) return null;
  const utilisateur = await obtenirUtilisateurConnecte();
  return utilisateur.estSuperAdmin && !utilisateur.doitChangerMotDePasse ? utilisateur : null;
}
