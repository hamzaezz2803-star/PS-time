import { TEXTES_CONNEXION } from "@/lib/textes/connexion";

const { erreurs } = TEXTES_CONNEXION;

const STATUT_TROP_DE_REQUETES = 429;
const STATUT_INTERDIT = 403;
const STATUT_NON_AUTORISE = 401;

type ErreurConnexion = { status?: number; code?: string };

/** Traduit une erreur renvoyée par le serveur d'authentification en message pour l'utilisateur. */
export function messagePourErreurConnexion(erreur: ErreurConnexion): string {
  if (erreur.status === STATUT_TROP_DE_REQUETES) return erreurs.tropDeTentatives;
  // Doit rester identique à CODE_COMPTE_DESACTIVE (lib/donnees/authentification.ts).
  if (erreur.status === STATUT_INTERDIT && erreur.code === "COMPTE_DESACTIVE") {
    return erreurs.compteDesactive;
  }
  if (erreur.status === STATUT_NON_AUTORISE) return erreurs.identifiantsInvalides;
  return erreurs.serviceIndisponible;
}
