import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { DOMAINE_EMAIL_INTERNE, DUREE_JETON_INSTALLATION_SECONDES } from "@/lib/constantes";
import { obtenirBase } from "./base";
import { comptes, utilisateurs, verifications } from "./schema";

/** Nom des jetons d'installation dans la table `verifications`. */
const TYPE_JETON = "installation";
const OCTETS_JETON = 32;
/** Nom imposé par Better Auth pour une connexion par mot de passe. */
const FOURNISSEUR_MOT_DE_PASSE = "credential";

/** Seule l'empreinte du jeton est gardée en base : une fuite de la table ne le révèle pas. */
const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/** Vrai dès qu'un utilisateur existe : le compte d'installation ne sert plus. */
export async function installationTerminee(): Promise<boolean> {
  const [resultat] = await obtenirBase().select({ total: count() }).from(utilisateurs);
  return (resultat?.total ?? 0) > 0;
}

/** Crée un jeton à usage unique, valable quelques minutes, qui autorise la création du premier compte. */
export async function creerJetonInstallation(): Promise<string> {
  const jeton = randomBytes(OCTETS_JETON).toString("base64url");
  const base = obtenirBase();
  // Ménage : les jetons expirés ne servent plus.
  await base.delete(verifications).where(and(eq(verifications.identifiant, TYPE_JETON), lt(verifications.expireLe, new Date())));
  await base
    .insert(verifications)
    .values({
      id: crypto.randomUUID(),
      identifiant: TYPE_JETON,
      valeur: empreinte(jeton),
      expireLe: new Date(Date.now() + DUREE_JETON_INSTALLATION_SECONDES * 1000),
    });
  return jeton;
}

/**
 * Crée le premier super administrateur si le jeton est valide et qu'aucun utilisateur n'existe,
 * dans une transaction : le jeton est consommé (usage unique) même si la création échoue ensuite.
 * Renvoie false si le jeton est invalide, expiré, déjà utilisé, ou si un compte existe déjà.
 */
export async function creerPremierAdministrateur(jeton: string, identifiant: string, motDePasse: string): Promise<boolean> {
  const empreinteMotDePasse = await hashPassword(motDePasse);
  return obtenirBase().transaction(async (transaction) => {
    const [suppression] = await transaction
      .delete(verifications)
      .where(and(eq(verifications.identifiant, TYPE_JETON), eq(verifications.valeur, empreinte(jeton)), gt(verifications.expireLe, new Date())));
    if (suppression.affectedRows !== 1) return false;

    // Verrou sur la table : deux créations simultanées ne peuvent pas passer toutes les deux.
    const existants = await transaction.select({ id: utilisateurs.id }).from(utilisateurs).limit(1).for("update");
    if (existants.length > 0) return false;

    const id = crypto.randomUUID();
    await transaction.insert(utilisateurs).values({
      id,
      identifiant,
      email: `${identifiant}@${DOMAINE_EMAIL_INTERNE}`,
      nom: identifiant,
      estSuperAdmin: true,
      // Le mot de passe vient d'être choisi par l'administrateur lui-même.
      doitChangerMotDePasse: false,
    });
    await transaction.insert(comptes).values({
      id: crypto.randomUUID(),
      utilisateurId: id,
      fournisseurId: FOURNISSEUR_MOT_DE_PASSE,
      compteId: id,
      motDePasse: empreinteMotDePasse,
    });
    return true;
  });
}
