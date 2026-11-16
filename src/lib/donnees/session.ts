import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CHEMIN_CHANGER_MOT_DE_PASSE, CHEMIN_CONNEXION } from "@/lib/constantes";
import { modulesAccessibles, type Module } from "@/lib/metier/droits";
import { auth } from "./authentification";
import { listerModulesAccordes } from "./utilisateurs";

export type UtilisateurConnecte = {
  id: string;
  nom: string;
  email: string;
  identifiant: string;
  doitChangerMotDePasse: boolean;
  estSuperAdmin: boolean;
  /** Modules que ce compte peut gérer (tous pour un super administrateur), relus à chaque requête. */
  modules: Module[];
};

/**
 * Lit la session depuis le cookie et la base. Redirige vers la connexion si elle
 * est absente, expirée ou si le compte a été désactivé depuis.
 * Mise en cache le temps d'une requête (layout, page et composants la partagent).
 * À appeler dans un composant placé sous <Suspense> (Cache Components).
 */
export const obtenirUtilisateurConnecte = cache(async (): Promise<UtilisateurConnecte> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.estActif) redirect(CHEMIN_CONNEXION);

  const { user } = session;
  const accordes = user.estSuperAdmin ? [] : await listerModulesAccordes(user.id);
  return {
    id: user.id,
    nom: user.name,
    email: user.email,
    // Toujours renseigné : la colonne `identifiant` est obligatoire en base.
    identifiant: user.username ?? "",
    doitChangerMotDePasse: user.doitChangerMotDePasse,
    estSuperAdmin: user.estSuperAdmin,
    modules: modulesAccessibles({ estSuperAdmin: user.estSuperAdmin, modules: accordes }),
  };
});

/**
 * Pour les pages du tableau de bord : comme obtenirUtilisateurConnecte, et renvoie
 * vers le changement de mot de passe tant qu'il est obligatoire.
 */
export async function obtenirUtilisateurPourEspace(): Promise<UtilisateurConnecte> {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (utilisateur.doitChangerMotDePasse) redirect(CHEMIN_CHANGER_MOT_DE_PASSE);
  return utilisateur;
}
