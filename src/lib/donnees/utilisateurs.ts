import "server-only";

import { eq } from "drizzle-orm";
import { obtenirBase } from "./base";
import { utilisateurs } from "./schema";

export async function estUtilisateurActif(utilisateurId: string): Promise<boolean> {
  const [utilisateur] = await obtenirBase()
    .select({ estActif: utilisateurs.estActif })
    .from(utilisateurs)
    .where(eq(utilisateurs.id, utilisateurId))
    .limit(1);
  return utilisateur?.estActif === true;
}

/** Appelée uniquement après un changement de mot de passe réussi. */
export async function marquerMotDePasseChange(utilisateurId: string): Promise<void> {
  await obtenirBase()
    .update(utilisateurs)
    .set({ doitChangerMotDePasse: false })
    .where(eq(utilisateurs.id, utilisateurId));
}
