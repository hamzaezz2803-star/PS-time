import "server-only";

import { enregistrerNotification } from "@/lib/donnees/notifications";
import { obtenirUtilisateurConnecte } from "@/lib/donnees/session";
import type { ActionNotification, ObjetNotification } from "@/lib/metier/notifications";

/**
 * Note une action réussie dans les notifications (auteur lu dans la session). À appeler après
 * l'enregistrement : un échec ici est journalisé mais n'annule jamais l'action de l'utilisateur.
 */
export async function notifier(objet: ObjetNotification, action: ActionNotification, libelle: string | null, lien: string | null = null): Promise<void> {
  try {
    const auteur = await obtenirUtilisateurConnecte();
    await enregistrerNotification({ objet, action, libelle, lien, auteur: { id: auteur.id, nom: auteur.nom } });
  } catch (erreur) {
    // redirect() de la session lève une erreur spéciale : elle n'arrive pas ici, l'action a déjà vérifié la session.
    console.error("Échec de l'enregistrement d'une notification", { type: erreur instanceof Error ? erreur.name : "inconnu" });
  }
}
