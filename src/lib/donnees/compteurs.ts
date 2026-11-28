import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { FAMILLES_COMPTEUR, LIMITE_COMPTEURS } from "@/lib/constantes";
import type { DefinitionCompteur } from "@/lib/metier/compteurs/calcul";
import { changeLaVersion, colonnesDesPeriodicites, periodicitesDesColonnes, resteAAdapter, type UniteCompteur } from "@/lib/metier/compteurs/format";
import type { DonneesCompteur } from "@/lib/validation/compteur";
import type { Compteur, FichePackCompteur, VersionCompteur } from "@/types";
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
  estAAdapter: compteurs.estAAdapter,
  numeroPack: compteurs.numeroPack,
  famille: compteurs.famille,
  fonctionnement: compteurs.fonctionnement,
  adaptation: compteurs.adaptation,
  remiseAZero: compteurs.remiseAZero,
};

type LigneCompteur = {
  journalier: boolean;
  hebdomadaire: boolean;
  mensuel: boolean;
  unite: string;
  numeroPack: number | null;
  famille: string | null;
  fonctionnement: string | null;
  adaptation: string | null;
  remiseAZero: string | null;
} & Omit<Compteur, "periodicites" | "unite" | "pack">;

/** Fiche du pack standard, ou null pour un compteur créé par le client. */
function fichePack({ numeroPack, famille, fonctionnement, adaptation, remiseAZero }: LigneCompteur): FichePackCompteur | null {
  if (numeroPack === null) return null;
  // La contrainte « check » de la base garantit une famille connue ; « autres » si elle manque.
  const familleConnue = FAMILLES_COMPTEUR.find((valeur) => valeur === famille) ?? "autres";
  return { numero: numeroPack, famille: familleConnue, fonctionnement, adaptation, remiseAZero };
}

const versCompteur = (ligne: LigneCompteur): Compteur => ({
  id: ligne.id,
  code: ligne.code,
  nom: ligne.nom,
  formule: ligne.formule,
  description: ligne.description,
  estActif: ligne.estActif,
  version: ligne.version,
  estAAdapter: ligne.estAAdapter,
  // La contrainte « check » de la base garantit une unité connue.
  unite: ligne.unite as UniteCompteur,
  periodicites: periodicitesDesColonnes(ligne),
  pack: fichePack(ligne),
});

/** Compteurs triés par libellé. */
export async function listerCompteurs(): Promise<Compteur[]> {
  const lignes = await obtenirBase().select(colonnes).from(compteurs).orderBy(asc(compteurs.libelle)).limit(LIMITE_COMPTEURS);
  return lignes.map(versCompteur);
}

/** Formule et périodicités d'un compteur (contrôle avant son activation), ou null s'il n'existe plus. */
export async function formuleDuCompteur(id: string): Promise<Pick<Compteur, "formule" | "periodicites"> | null> {
  const [ligne] = await obtenirBase()
    .select({ formule: compteurs.formule, journalier: compteurs.journalier, hebdomadaire: compteurs.hebdomadaire, mensuel: compteurs.mensuel })
    .from(compteurs)
    .where(eq(compteurs.id, id));
  return ligne ? { formule: ligne.formule, periodicites: periodicitesDesColonnes(ligne) } : null;
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
  | { ok: false; erreur: "introuvable" | "code" | "libelle" | "a_adapter" | "standard" };

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
      // Un compteur standard est fixe : il ne se modifie pas (le client crée le sien).
      if (actuel.numeroPack !== null) return { ok: false, erreur: "standard" };
      // Un compteur « à adapter » le reste tant que sa formule n'a pas été réécrite.
      const estAAdapter = resteAAdapter(actuel, donnees.formule);
      if (estAAdapter && donnees.estActif) return { ok: false, erreur: "a_adapter" };
      const nouvelleVersion = changeLaVersion(versCompteur(actuel), donnees) ? actuel.version + 1 : actuel.version;
      await transaction.update(compteurs).set({ ...champs, estAAdapter, version: nouvelleVersion }).where(eq(compteurs.id, id));
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

/**
 * Active ou désactive un compteur. Un compteur du pack encore « à adapter » ne s'active pas
 * (la base le refuse aussi : contrainte `compteurs_a_adapter_inactif`).
 */
export async function changerEtatCompteur(id: string, estActif: boolean, auteurId: string): Promise<"ok" | "introuvable" | "a_adapter"> {
  const condition = estActif ? and(eq(compteurs.id, id), eq(compteurs.estAAdapter, false)) : eq(compteurs.id, id);
  const resultat = await obtenirBase().update(compteurs).set({ estActif, modifiePar: auteurId }).where(condition);
  if ((resultat.rowCount ?? 0) > 0) return "ok";
  const [existe] = await obtenirBase().select({ id: compteurs.id }).from(compteurs).where(eq(compteurs.id, id));
  return existe ? "a_adapter" : "introuvable";
}

export type ResultatSuppressionCompteur = { ok: true; libelle: string } | { ok: false; erreur: "introuvable" | "standard" };

/**
 * Supprime un compteur et tout son historique de versions, dans une transaction.
 * Un compteur standard ne se supprime pas : il se désactive.
 */
export async function supprimerCompteurParId(id: string): Promise<ResultatSuppressionCompteur> {
  return obtenirBase().transaction(async (transaction): Promise<ResultatSuppressionCompteur> => {
    const [compteur] = await transaction
      .select({ libelle: compteurs.libelle, numeroPack: compteurs.numeroPack })
      .from(compteurs)
      .where(eq(compteurs.id, id))
      .for("update");
    if (!compteur) return { ok: false, erreur: "introuvable" };
    if (compteur.numeroPack !== null) return { ok: false, erreur: "standard" };
    await transaction.delete(compteursVersions).where(eq(compteursVersions.compteurId, id));
    await transaction.delete(compteurs).where(eq(compteurs.id, id));
    return { ok: true, libelle: compteur.libelle };
  });
}
