import "server-only";

import { enregistrerHistorique, type NouvelleEntreeHistorique } from "@/lib/donnees/historique";
import { enregistrerNotification } from "@/lib/donnees/notifications";
import { obtenirUtilisateurConnecte } from "@/lib/donnees/session";
import type { ActionHistorique, ObjetHistorique } from "@/lib/metier/historique";
import type { ActionNotification, ObjetNotification } from "@/lib/metier/notifications";

const journaliserEchec = (quoi: string, erreur: unknown) =>
  console.error(`Échec de l'enregistrement ${quoi}`, { type: erreur instanceof Error ? erreur.name : "inconnu" });

/** Note une ligne d'historique ; un échec est journalisé mais n'annule jamais l'action. */
export async function enregistrerTrace(entree: NouvelleEntreeHistorique): Promise<void> {
  try {
    await enregistrerHistorique(entree);
  } catch (erreur) {
    journaliserEchec("d'une ligne d'historique", erreur);
  }
}

/**
 * Trace dans l'historique une action qui n'a pas de notification (export...), auteur lu dans
 * la session. À appeler après l'action réussie.
 */
export async function tracer(action: ActionHistorique, objet: ObjetHistorique, libelle: string | null, lien: string | null = null): Promise<void> {
  try {
    const auteur = await obtenirUtilisateurConnecte();
    await enregistrerTrace({ action, objet, libelle, lien, auteur: { id: auteur.id, nom: auteur.nom, identifiant: auteur.identifiant } });
  } catch (erreur) {
    journaliserEchec("d'une ligne d'historique", erreur);
  }
}

/**
 * Note une action réussie dans les notifications et dans l'historique (auteur lu dans la session).
 * À appeler après l'enregistrement : un échec ici est journalisé mais n'annule jamais l'action.
 */
export async function notifier(objet: ObjetNotification, action: ActionNotification, libelle: string | null, lien: string | null = null): Promise<void> {
  try {
    const auteur = await obtenirUtilisateurConnecte();
    await Promise.all([
      enregistrerNotification({ objet, action, libelle, lien, auteur: { id: auteur.id, nom: auteur.nom } }).catch((erreur: unknown) =>
        journaliserEchec("d'une notification", erreur),
      ),
      enregistrerTrace({ action, objet, libelle, lien, auteur: { id: auteur.id, nom: auteur.nom, identifiant: auteur.identifiant } }),
    ]);
  } catch (erreur) {
    // redirect() de la session lève une erreur spéciale : elle n'arrive pas ici, l'action a déjà vérifié la session.
    journaliserEchec("d'une notification", erreur);
  }
}
