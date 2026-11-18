import "server-only";

import { hashPassword } from "better-auth/crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { DOMAINE_EMAIL_INTERNE, LIMITE_UTILISATEURS } from "@/lib/constantes";
import { nettoyerPages, type Page } from "@/lib/metier/droits";
import type { UtilisateurListe } from "@/types";
import { obtenirBase } from "./base";
import { autorisationsPages, comptes, sessions, utilisateurs } from "./schema";

/** Nom imposé par Better Auth pour une connexion par mot de passe. */
const FOURNISSEUR_MOT_DE_PASSE = "credential";

type Base = ReturnType<typeof obtenirBase>;
type Transaction = Parameters<Parameters<Base["transaction"]>[0]>[0];

export async function estUtilisateurActif(utilisateurId: string): Promise<boolean> {
  const [utilisateur] = await obtenirBase()
    .select({ estActif: utilisateurs.estActif })
    .from(utilisateurs)
    .where(eq(utilisateurs.id, utilisateurId))
    .limit(1);
  return utilisateur?.estActif === true;
}

/** Nom et identifiant d'un compte (auteur d'une ligne d'historique), ou null s'il n'existe plus. */
export async function lireIdentite(utilisateurId: string): Promise<{ nom: string; identifiant: string } | null> {
  const [utilisateur] = await obtenirBase()
    .select({ nom: utilisateurs.nom, identifiant: utilisateurs.identifiant })
    .from(utilisateurs)
    .where(eq(utilisateurs.id, utilisateurId))
    .limit(1);
  return utilisateur ?? null;
}

/** Appelée uniquement après un changement de mot de passe réussi. */
export async function marquerMotDePasseChange(utilisateurId: string): Promise<void> {
  await obtenirBase()
    .update(utilisateurs)
    .set({ doitChangerMotDePasse: false })
    .where(eq(utilisateurs.id, utilisateurId));
}

/** Pages accordées à un administrateur (vide pour un super administrateur, qui a tout). */
export async function listerPagesAccordees(utilisateurId: string): Promise<Page[]> {
  const lignes = await obtenirBase()
    .select({ page: autorisationsPages.page })
    .from(autorisationsPages)
    .where(eq(autorisationsPages.utilisateurId, utilisateurId));
  return nettoyerPages(lignes.map((ligne) => ligne.page));
}

/** Comptes triés (super administrateurs d'abord, puis par identifiant), avec leurs pages accordées. */
export async function listerUtilisateurs(): Promise<UtilisateurListe[]> {
  const base = obtenirBase();
  const [lignes, autorisations] = await Promise.all([
    base
      .select({
        id: utilisateurs.id,
        identifiant: utilisateurs.identifiant,
        nomComplet: utilisateurs.nom,
        estSuperAdmin: utilisateurs.estSuperAdmin,
        estActif: utilisateurs.estActif,
        doitChangerMotDePasse: utilisateurs.doitChangerMotDePasse,
        modifieLe: utilisateurs.modifieLe,
      })
      .from(utilisateurs)
      .orderBy(desc(utilisateurs.estSuperAdmin), asc(utilisateurs.identifiant))
      .limit(LIMITE_UTILISATEURS),
    base.select({ utilisateurId: autorisationsPages.utilisateurId, page: autorisationsPages.page }).from(autorisationsPages),
  ]);
  return lignes
    .map((ligne) => ({
      ...ligne,
      // `nom` sert aux titres des fenêtres de la liste : l'identifiant, unique et toujours connu.
      nom: ligne.identifiant,
      pages: nettoyerPages(autorisations.filter((a) => a.utilisateurId === ligne.id).map((a) => a.page)),
    }));
}

/** Remplace les pages accordées à un administrateur. */
async function fixerPages(transaction: Transaction, utilisateurId: string, pages: Page[]): Promise<void> {
  await transaction.delete(autorisationsPages).where(eq(autorisationsPages.utilisateurId, utilisateurId));
  if (pages.length > 0) {
    await transaction.insert(autorisationsPages).values(pages.map((page) => ({ utilisateurId, page })));
  }
}

export type NouvelUtilisateur = {
  identifiant: string;
  nom: string;
  motDePasse: string;
  estSuperAdmin: boolean;
  /** Vrai : le mot de passe est provisoire et devra être changé à la première connexion. */
  doitChangerMotDePasse: boolean;
  pages: Page[];
};

/** Crée un compte et son mot de passe (empreinte scrypt) dans la transaction donnée. */
export async function insererUtilisateur(transaction: Transaction, nouveau: NouvelUtilisateur): Promise<string> {
  const id = crypto.randomUUID();
  await transaction.insert(utilisateurs).values({
    id,
    identifiant: nouveau.identifiant,
    // La connexion se fait par identifiant : e-mail interne exigé par Better Auth, jamais utilisé.
    email: `${nouveau.identifiant}@${DOMAINE_EMAIL_INTERNE}`,
    nom: nouveau.nom,
    estSuperAdmin: nouveau.estSuperAdmin,
    doitChangerMotDePasse: nouveau.doitChangerMotDePasse,
  });
  await transaction.insert(comptes).values({
    id: crypto.randomUUID(),
    utilisateurId: id,
    fournisseurId: FOURNISSEUR_MOT_DE_PASSE,
    compteId: id,
    motDePasse: await hashPassword(nouveau.motDePasse),
  });
  if (!nouveau.estSuperAdmin) await fixerPages(transaction, id, nouveau.pages);
  return id;
}

/** Crée un administrateur (mot de passe provisoire) avec ses pages accordées. */
export async function creerAdministrateur(donnees: Omit<NouvelUtilisateur, "estSuperAdmin" | "doitChangerMotDePasse">): Promise<string> {
  return obtenirBase().transaction((transaction) =>
    insererUtilisateur(transaction, { ...donnees, estSuperAdmin: false, doitChangerMotDePasse: true }),
  );
}

export type ModificationUtilisateur = {
  nom: string;
  estActif: boolean;
  pages: Page[];
  /** Nouveau mot de passe provisoire, ou null pour garder l'actuel. */
  motDePasse: string | null;
};

/**
 * Modifie un compte dans une transaction. Les pages d'un super administrateur ne changent pas
 * (il a tout). Un nouveau mot de passe est provisoire ; désactivation ou nouveau mot de passe
 * ferment les sessions ouvertes. Renvoie false si le compte n'existe plus.
 */
export async function modifierUtilisateur(id: string, modification: ModificationUtilisateur): Promise<boolean> {
  return obtenirBase().transaction(async (transaction) => {
    const [existant] = await transaction
      .select({ estSuperAdmin: utilisateurs.estSuperAdmin })
      .from(utilisateurs)
      .where(eq(utilisateurs.id, id))
      .limit(1)
      .for("update");
    if (!existant) return false;

    const { motDePasse } = modification;
    await transaction
      .update(utilisateurs)
      .set({ nom: modification.nom, estActif: modification.estActif, ...(motDePasse ? { doitChangerMotDePasse: true } : {}) })
      .where(eq(utilisateurs.id, id));
    if (motDePasse) {
      await transaction
        .update(comptes)
        .set({ motDePasse: await hashPassword(motDePasse) })
        .where(and(eq(comptes.utilisateurId, id), eq(comptes.fournisseurId, FOURNISSEUR_MOT_DE_PASSE)));
    }
    if (motDePasse || !modification.estActif) await transaction.delete(sessions).where(eq(sessions.utilisateurId, id));
    if (!existant.estSuperAdmin) await fixerPages(transaction, id, modification.pages);
    return true;
  });
}

/** Supprime un administrateur (jamais un super administrateur) ; sessions et droits partent avec lui. */
export async function supprimerAdministrateur(id: string): Promise<void> {
  await obtenirBase()
    .delete(utilisateurs)
    .where(and(eq(utilisateurs.id, id), eq(utilisateurs.estSuperAdmin, false)));
}
