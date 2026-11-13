import type { IdentifiantsConnexion, Resultat } from "@/types";

export type ErreurAuthentification =
  | "identifiants_invalides"
  | "service_non_configure";

/**
 * Point d'entrée unique vers le service d'authentification.
 * Aucun service n'est encore branché (Supabase Auth ou équivalent, à choisir) :
 * on refuse toute connexion plutôt que de simuler un système maison.
 */
export async function authentifier(
  identifiants: IdentifiantsConnexion,
): Promise<Resultat<{ utilisateurId: string }>> {
  void identifiants;
  const erreur: ErreurAuthentification = "service_non_configure";
  return { ok: false, erreur };
}
