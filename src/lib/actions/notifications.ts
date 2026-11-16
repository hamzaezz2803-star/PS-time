"use server";

import { compterNonLues, listerNotifications, marquerNotificationsLues } from "@/lib/donnees/notifications";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { modulesNotifications } from "@/lib/metier/notifications";
import type { Notification, Resultat } from "@/types";

export type EtatNotifications = { notifications: Notification[]; nonLues: number; idConnecte: string };

/** Notifications des modules du compte connecté (droits relus à chaque appel) et nombre de non lues. */
export async function lireNotifications(): Promise<Resultat<EtatNotifications>> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  const modules = modulesNotifications(utilisateur);
  try {
    const [notifications, nonLues] = await Promise.all([listerNotifications(modules), compterNonLues(utilisateur.id, modules)]);
    return { ok: true, donnees: { notifications, nonLues, idConnecte: utilisateur.id } };
  } catch (erreur) {
    console.error("Échec de la lecture des notifications", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { ok: false, erreur: "lecture" };
  }
}

/** À l'ouverture de la cloche : tout ce qui est affiché devient lu pour ce compte. */
export async function marquerLues(): Promise<void> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  try {
    await marquerNotificationsLues(utilisateur.id);
  } catch (erreur) {
    console.error("Échec du marquage des notifications", { type: erreur instanceof Error ? erreur.name : "inconnu" });
  }
}
