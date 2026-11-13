import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CHEMIN_CHANGER_MOT_DE_PASSE, CHEMIN_CONNEXION } from "@/lib/constantes";
import { auth } from "./authentification";

export type UtilisateurConnecte = {
  id: string;
  nom: string;
  email: string;
  identifiant: string;
  doitChangerMotDePasse: boolean;
  estSuperAdmin: boolean;
};

/**
 * Lit la session depuis le cookie et la base. Redirige vers la connexion si elle
 * est absente, expirée ou si le compte a été désactivé depuis.
 * À appeler dans un composant placé sous <Suspense> (Cache Components).
 */
export async function obtenirUtilisateurConnecte(): Promise<UtilisateurConnecte> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.estActif) redirect(CHEMIN_CONNEXION);

  const { user } = session;
  return {
    id: user.id,
    nom: user.name,
    email: user.email,
    identifiant: user.identifiant,
    doitChangerMotDePasse: user.doitChangerMotDePasse,
    estSuperAdmin: user.estSuperAdmin,
  };
}

/**
 * Pour les pages du tableau de bord : comme obtenirUtilisateurConnecte, et renvoie
 * vers le changement de mot de passe tant qu'il est obligatoire.
 */
export async function obtenirUtilisateurPourEspace(): Promise<UtilisateurConnecte> {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (utilisateur.doitChangerMotDePasse) redirect(CHEMIN_CHANGER_MOT_DE_PASSE);
  return utilisateur;
}
