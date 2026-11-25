import "server-only";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { DOMAINE_EMAIL_INTERNE } from "@/lib/constantes";
import { identifiantDepuisMatricule } from "@/lib/metier/pointage-distance";
import { comptes, sessions, utilisateurs } from "./schema";
import { FOURNISSEUR_MOT_DE_PASSE, insererUtilisateur, type Transaction } from "./utilisateurs";

export type EmployePourCompte = { id: string; matricule: string; prenom: string; nom: string };

/** Erreur levée quand le matricule ne peut pas servir d'identifiant (vérifié avant, par la validation). */
export class MatriculeNonUtilisable extends Error {
  override name = "MatriculeNonUtilisable";
}

/** Remet le matricule comme mot de passe provisoire et ferme les sessions ouvertes. */
async function reinitialiserMotDePasse(transaction: Transaction, utilisateurId: string, matricule: string): Promise<void> {
  await transaction.update(utilisateurs).set({ doitChangerMotDePasse: true }).where(eq(utilisateurs.id, utilisateurId));
  await transaction
    .update(comptes)
    .set({ motDePasse: await hashPassword(matricule) })
    .where(and(eq(comptes.utilisateurId, utilisateurId), eq(comptes.fournisseurId, FOURNISSEUR_MOT_DE_PASSE)));
  await transaction.delete(sessions).where(eq(sessions.utilisateurId, utilisateurId));
}

/**
 * Compte de connexion de l'employé, tenu à jour avec sa fiche (même transaction) :
 * - pointage à distance autorisé : compte créé au besoin (identifiant = matricule en minuscules,
 *   mot de passe provisoire = matricule, à changer à la première connexion), sinon réactivé ;
 * - non autorisé : compte désactivé et sessions fermées (le compte est gardé pour l'historique).
 * `reinitialiser` remet le matricule comme mot de passe provisoire.
 */
export async function synchroniserCompteEmploye(
  transaction: Transaction,
  employe: EmployePourCompte,
  estAutorise: boolean,
  reinitialiser: boolean,
): Promise<void> {
  const [existant] = await transaction
    .select({ id: utilisateurs.id })
    .from(utilisateurs)
    .where(eq(utilisateurs.employeId, employe.id))
    .limit(1)
    .for("update");

  if (!estAutorise) {
    if (existant) {
      await transaction.update(utilisateurs).set({ estActif: false }).where(eq(utilisateurs.id, existant.id));
      await transaction.delete(sessions).where(eq(sessions.utilisateurId, existant.id));
    }
    return;
  }

  const identifiant = identifiantDepuisMatricule(employe.matricule);
  if (!identifiant) throw new MatriculeNonUtilisable();
  const nom = `${employe.prenom} ${employe.nom}`;

  if (!existant) {
    await insererUtilisateur(transaction, {
      identifiant,
      nom,
      motDePasse: employe.matricule.trim(),
      estSuperAdmin: false,
      doitChangerMotDePasse: true,
      pages: [],
      employeId: employe.id,
    });
    return;
  }
  // Le matricule peut avoir changé : l'identifiant le suit.
  await transaction
    .update(utilisateurs)
    .set({ identifiant, email: `${identifiant}@${DOMAINE_EMAIL_INTERNE}`, nom, estActif: true })
    .where(eq(utilisateurs.id, existant.id));
  if (reinitialiser) await reinitialiserMotDePasse(transaction, existant.id, employe.matricule.trim());
}
