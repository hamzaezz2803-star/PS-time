import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { LIMITE_COMPTEURS } from "@/lib/constantes";
import type { DefinitionCompteur } from "@/lib/metier/compteurs/calcul";
import { changeLaVersion, colonnesDesPeriodicites, periodicitesDesColonnes, type UniteCompteur } from "@/lib/metier/compteurs/format";
import type { DonneesCompteur } from "@/lib/validation/compteur";
import type { Compteur, VersionCompteur } from "@/types";
import { obtenirBase } from "./base";
import { indexEnDoublon } from "./erreurs";
import { compteurs, compteursVersions, utilisateurs } from "./schema";

const colonnes = {
  id: compteurs.id,
  code: compteurs.code,
  nom: compteurs.libelle,
  formule: compteurs.formule,
  journalier: compteurs.journalier,
  hebdomadaire: compteurs.hebdomadaire,
  mensuel: compteurs.mensuel,
  unite: compteurs.unite,
  description: compteurs.description,
  estActif: compteurs.estActif,
  version: compteurs.version,
};

type LigneCompteur = { journalier: boolean; hebdomadaire: boolean; mensuel: boolean; unite: string } & Omit<Compteur, "periodicites" | "unite">;

const versCompteur = ({ journalier, hebdomadaire, mensuel, unite, ...reste }: LigneCompteur): Compteur => ({
  ...reste,
  // La contrainte « check » de la base garantit une unité connue.
  unite: unite as UniteCompteur,
  periodicites: periodicitesDesColonnes({ journalier, hebdomadaire, mensuel }),
});

/** Compteurs triés par libellé. */
export async function listerCompteurs(): Promise<Compteur[]> {
  const lignes = await obtenirBase().select(colonnes).from(compteurs).orderBy(asc(compteurs.libelle)).limit(LIMITE_COMPTEURS);
  return lignes.map(versCompteur);
}

/** Compteurs actifs, prêts à être calculés. */
export async function listerCompteursActifs(): Promise<(DefinitionCompteur & Compteur)[]> {
  const lignes = await obtenirBase().select(colonnes).from(compteurs).where(eq(compteurs.estActif, true)).orderBy(asc(compteurs.libelle)).limit(LIMITE_COMPTEURS);
  return lignes.map(versCompteur);
}

/** Historique des versions d'un compteur, la plus récente d'abord. */
export async function listerVersions(compteurId: string): Promise<VersionCompteur[]> {
  const lignes = await obtenirBase()
    .select({
      version: compteursVersions.version,
      formule: compteursVersions.formule,
      journalier: compteursVersions.journalier,
      hebdomadaire: compteursVersions.hebdomadaire,
      mensuel: compteursVersions.mensuel,
      unite: compteursVersions.unite,
      auteur: utilisateurs.nom,
      date: compteursVersions.creeLe,
    })
    .from(compteursVersions)
    .leftJoin(utilisateurs, eq(utilisateurs.id, compteursVersions.modifiePar))
    .where(eq(compteursVersions.compteurId, compteurId))
    .orderBy(desc(compteursVersions.version));
  return lignes.map(({ journalier, hebdomadaire, mensuel, date, ...reste }) => ({
    ...reste,
    periodicites: periodicitesDesColonnes({ journalier, hebdomadaire, mensuel }),
    date: date.toISOString(),
  }));
}

export type ResultatCompteur =
  | { ok: true; id: string; version: number }
  | { ok: false; erreur: "introuvable" | "code" | "libelle" };

/** Champs d'une version (formule, unité, périodicités) : copiés dans `compteurs_versions`. */
const champsVersion = (donnees: DonneesCompteur) => ({ formule: donnees.formule, unite: donnees.unite, ...colonnesDesPeriodicites(donnees.periodicites) });

/**
 * Crée un compteur (version 1) ou le modifie, dans une transaction. Changer la formule, l'unité
 * ou les périodicités crée une nouvelle version, archivée. L'identifiant (`code`) ne change pas.
 */
export async function enregistrerCompteur(id: string | null, donnees: DonneesCompteur, auteurId: string): Promise<ResultatCompteur> {
  try {
    return await obtenirBase().transaction(async (transaction): Promise<ResultatCompteur> => {
      const champs = { libelle: donnees.libelle, description: donnees.description, estActif: donnees.estActif, ...champsVersion(donnees), modifiePar: auteurId };
      if (!id) {
        const nouvelId = crypto.randomUUID();
        await transaction.insert(compteurs).values({ id: nouvelId, code: donnees.code, ...champs, version: 1, creePar: auteurId });
        await transaction.insert(compteursVersions).values({ compteurId: nouvelId, version: 1, ...champsVersion(donnees), modifiePar: auteurId });
        return { ok: true, id: nouvelId, version: 1 };
      }

      const [actuel] = await transaction.select(colonnes).from(compteurs).where(eq(compteurs.id, id)).for("update");
      if (!actuel) return { ok: false, erreur: "introuvable" };
      const nouvelleVersion = changeLaVersion(versCompteur(actuel), donnees) ? actuel.version + 1 : actuel.version;
      await transaction.update(compteurs).set({ ...champs, version: nouvelleVersion }).where(eq(compteurs.id, id));
      if (nouvelleVersion !== actuel.version) {
        await transaction.insert(compteursVersions).values({ compteurId: id, version: nouvelleVersion, ...champsVersion(donnees), modifiePar: auteurId });
      }
      return { ok: true, id, version: nouvelleVersion };
    });
  } catch (erreur) {
    const index = indexEnDoublon(erreur);
    if (index === "compteurs_code_idx") return { ok: false, erreur: "code" };
    if (index === "compteurs_libelle_idx") return { ok: false, erreur: "libelle" };
    throw erreur;
  }
}

/** Active ou désactive un compteur ; faux s'il n'existe plus. */
export async function changerEtatCompteur(id: string, estActif: boolean, auteurId: string): Promise<boolean> {
  const resultat = await obtenirBase().update(compteurs).set({ estActif, modifiePar: auteurId }).where(eq(compteurs.id, id));
  return (resultat.rowCount ?? 0) > 0;
}

/**
 * Supprime un compteur et tout son historique de versions, dans une transaction.
 * Renvoie son libellé, ou null s'il n'existe plus.
 */
export async function supprimerCompteurParId(id: string): Promise<string | null> {
  return obtenirBase().transaction(async (transaction) => {
    const [compteur] = await transaction.select({ libelle: compteurs.libelle }).from(compteurs).where(eq(compteurs.id, id)).for("update");
    if (!compteur) return null;
    await transaction.delete(compteursVersions).where(eq(compteursVersions.compteurId, id));
    await transaction.delete(compteurs).where(eq(compteurs.id, id));
    return compteur.libelle;
  });
}
