import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CHEMIN_CHANGER_MOT_DE_PASSE, CHEMIN_CONNEXION, CHEMIN_ESPACE, CHEMIN_POINTAGE_EMPLOYE } from "@/lib/constantes";
import { modulesAccessibles, pagesAccessibles, type Module, type Page } from "@/lib/metier/droits";
import { auth } from "./authentification";
import { listerPagesAccordees } from "./utilisateurs";

export type UtilisateurConnecte = {
  id: string;
  nom: string;
  email: string;
  identifiant: string;
  doitChangerMotDePasse: boolean;
  estSuperAdmin: boolean;
  /** Employé dont c'est le compte (pointage à distance), ou null pour un administrateur. */
  employeId: string | null;
  /** Pages que ce compte peut voir et gérer (toutes pour un super administrateur), relues à chaque requête. */
  pages: Page[];
  /** Modules dont le compte a au moins une page (menu, tableau de bord). */
  modules: Module[];
};

/**
 * Lit la session depuis le cookie et la base. Redirige vers la connexion si elle
 * est absente, expirée ou si le compte a été désactivé depuis.
 * Mise en cache le temps d'une requête (layout, page et composants la partagent).
 * À appeler dans un composant placé sous <Suspense> (Cache Components).
 */
export const obtenirUtilisateurConnecte = cache(async (): Promise<UtilisateurConnecte> => {
  // Toujours à la requête : Better Auth lit l'heure (new Date()) pour vérifier l'expiration,
  // ce qui est interdit pendant le prérendu. connection() le place hors du rendu statique.
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.estActif) redirect(CHEMIN_CONNEXION);

  const { user } = session;
  const employeId = user.employeId ?? null;
  // Un compte d'employé n'a jamais de page, même si une ligne en base en accordait une.
  const accordees = user.estSuperAdmin || employeId ? [] : await listerPagesAccordees(user.id);
  const droits = { estSuperAdmin: user.estSuperAdmin, pages: accordees };
  return {
    id: user.id,
    nom: user.name,
    email: user.email,
    // Toujours renseigné : la colonne `identifiant` est obligatoire en base.
    identifiant: user.username ?? "",
    doitChangerMotDePasse: user.doitChangerMotDePasse,
    estSuperAdmin: user.estSuperAdmin,
    employeId,
    pages: pagesAccessibles(droits),
    modules: modulesAccessibles(droits),
  };
});

/**
 * Pour les pages du tableau de bord : comme obtenirUtilisateurConnecte, et renvoie
 * vers le changement de mot de passe tant qu'il est obligatoire. Un employé est renvoyé
 * vers son espace de pointage.
 */
export async function obtenirUtilisateurPourEspace(): Promise<UtilisateurConnecte> {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (utilisateur.doitChangerMotDePasse) redirect(CHEMIN_CHANGER_MOT_DE_PASSE);
  if (utilisateur.employeId) redirect(CHEMIN_POINTAGE_EMPLOYE);
  return utilisateur;
}

/** Pour l'espace de pointage : un compte d'employé uniquement (sinon le tableau de bord). */
export async function obtenirEmployeConnecte(): Promise<UtilisateurConnecte & { employeId: string }> {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (utilisateur.doitChangerMotDePasse) redirect(CHEMIN_CHANGER_MOT_DE_PASSE);
  const { employeId } = utilisateur;
  if (!employeId) redirect(CHEMIN_ESPACE);
  return { ...utilisateur, employeId };
}
