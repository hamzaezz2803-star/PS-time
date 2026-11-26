import "server-only";

import { and, asc, count, desc, eq, gte, inArray, ilike, lte, ne, or, type SQL } from "drizzle-orm";
import { PIECES_JOINTES_PAR_DROIT_MAX } from "@/lib/constantes";
import { periodesSeChevauchent } from "@/lib/metier/programme";
import { motifContient } from "@/lib/metier/recherche";
import type { DonneesCreationDroits, DonneesDroit } from "@/lib/validation/droit-conge";
import type { PieceJointeRecue } from "@/lib/validation/piece-jointe";
import type { RechercheAbsences } from "@/lib/validation/absence";
import type { DroitCongeListe, EvenementDroit } from "@/types";
import { obtenirBase } from "./base";
import { calculerSoldes, lireUniteDroit } from "./droits-conges-soldes";
import { compterPiecesDuDroit, listerPiecesDesDroits, relierPiecesAuxDroits, supprimerPiecesOrphelines } from "./pieces-jointes";
import { departements, droitsConges, employes, evenements, photosEmployes, utilisateurs } from "./schema";

/** Condition SQL des filtres (paramétrée) : employé par nom ou matricule, droit valable ce jour-là. */
function conditionRecherche(recherche: RechercheAbsences): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];
  if (recherche.employe) {
    const motif = motifContient(recherche.employe);
    conditions.push(or(ilike(employes.nom, motif), ilike(employes.prenom, motif), ilike(employes.matricule, motif)));
  }
  if (recherche.jour) conditions.push(lte(droitsConges.dateDebut, recherche.jour), gte(droitsConges.dateFin, recherche.jour));
  return and(...conditions);
}

/** Une page des droits (période la plus récente d'abord), chacun avec son solde calculé. */
export async function listerDroits(page: number, parPage: number, recherche: RechercheAbsences, aujourdhui: string): Promise<DroitCongeListe[]> {
  const lignes = await obtenirBase()
    .select({
      id: droitsConges.id,
      employeId: employes.id,
      prenom: employes.prenom,
      nom: employes.nom,
      matricule: employes.matricule,
      departement: departements.nom,
      photoModifieeLe: photosEmployes.modifieLe,
      evenementId: evenements.id,
      evenementCode: evenements.code,
      evenementNom: evenements.nom,
      debut: droitsConges.dateDebut,
      fin: droitsConges.dateFin,
      joursAcquis: droitsConges.joursAcquis,
      joursReliquat: droitsConges.joursReliquat,
      supplement1: droitsConges.supplement1,
      supplement2: droitsConges.supplement2,
      supplement3: droitsConges.supplement3,
      uniteSaisie: droitsConges.uniteSaisie,
      estConfirme: droitsConges.estConfirme,
      estReporte: droitsConges.estReporte,
      estBloquant: droitsConges.estBloquant,
      remarque: droitsConges.remarque,
      saisiPar: utilisateurs.nom,
    })
    .from(droitsConges)
    .innerJoin(employes, eq(employes.id, droitsConges.employeId))
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .innerJoin(evenements, eq(evenements.id, droitsConges.evenementId))
    .leftJoin(photosEmployes, eq(photosEmployes.employeId, employes.id))
    .leftJoin(utilisateurs, eq(utilisateurs.id, droitsConges.saisiPar))
    .where(conditionRecherche(recherche))
    .orderBy(desc(droitsConges.dateDebut), asc(employes.nom), asc(employes.prenom), asc(evenements.code))
    .limit(parPage)
    .offset((page - 1) * parPage);

  const [soldes, pieces] = await Promise.all([calculerSoldes(lignes, aujourdhui), listerPiecesDesDroits(lignes.map((ligne) => ligne.id))]);
  return lignes.map((ligne, rang) => {
    const { absences, ...bilan } = soldes[rang];
    return {
      ...ligne,
      uniteSaisie: lireUniteDroit(ligne.uniteSaisie),
      bilan,
      piecesJointes: pieces.get(ligne.id) ?? [],
      absences: absences.map(({ saisie, pris, prevus }) => ({ id: saisie.id, debut: saisie.debut, fin: saisie.fin, remarque: saisie.remarque, pris, prevus })),
    };
  });
}

export async function compterDroits(recherche: RechercheAbsences): Promise<number> {
  const [resultat] = await obtenirBase()
    .select({ total: count() })
    .from(droitsConges)
    .innerJoin(employes, eq(employes.id, droitsConges.employeId))
    .where(conditionRecherche(recherche));
  return resultat?.total ?? 0;
}

/** Événements proposés : ceux soumis à la gestion des droits (congé payé, récupération...). */
export async function listerEvenementsDroits(): Promise<EvenementDroit[]> {
  return obtenirBase().select({ id: evenements.id, code: evenements.code, nom: evenements.nom }).from(evenements).where(eq(evenements.estSoumisDroits, true)).orderBy(asc(evenements.code));
}

const valeursDroit = (donnees: DonneesDroit) => ({
  dateDebut: donnees.du,
  dateFin: donnees.au,
  joursAcquis: donnees.joursAcquis,
  joursReliquat: donnees.joursReliquat,
  supplement1: donnees.supplement1,
  supplement2: donnees.supplement2,
  supplement3: donnees.supplement3,
  uniteSaisie: donnees.uniteSaisie,
  estConfirme: donnees.estConfirme,
  estReporte: donnees.estReporte,
  estBloquant: donnees.estBloquant,
  remarque: donnees.remarque,
});

export type ResultatCreation =
  | { ok: true; nombre: number; evenementNom: string }
  | { ok: false; erreur: "evenement" | "employe" }
  | { ok: false; erreur: "chevauchement"; noms: string[] };

/**
 * Attribue le même droit à chaque employé, dans une transaction qui verrouille les employés :
 * deux saisies simultanées ne peuvent pas créer deux droits qui se chevauchent.
 */
export async function creerDroits(donnees: DonneesCreationDroits, pieces: PieceJointeRecue[], saisiPar: string): Promise<ResultatCreation> {
  return obtenirBase().transaction(async (transaction) => {
    const [evenement] = await transaction.select({ nom: evenements.nom, estSoumisDroits: evenements.estSoumisDroits }).from(evenements).where(eq(evenements.id, donnees.evenementId));
    if (!evenement || !evenement.estSoumisDroits) return { ok: false, erreur: "evenement" };

    const concernes = await transaction
      .select({ id: employes.id, prenom: employes.prenom, nom: employes.nom })
      .from(employes)
      .where(inArray(employes.id, donnees.employeIds))
      .for("update");
    if (concernes.length !== donnees.employeIds.length) return { ok: false, erreur: "employe" };

    const existants = await transaction
      .select({ employeId: droitsConges.employeId })
      .from(droitsConges)
      .where(and(inArray(droitsConges.employeId, donnees.employeIds), eq(droitsConges.evenementId, donnees.evenementId), lte(droitsConges.dateDebut, donnees.au), gte(droitsConges.dateFin, donnees.du)));
    const enConflit = new Set(existants.map((existant) => existant.employeId));
    if (enConflit.size > 0) {
      return { ok: false, erreur: "chevauchement", noms: concernes.filter((employe) => enConflit.has(employe.id)).map((employe) => `${employe.prenom} ${employe.nom}`) };
    }

    const nouveaux = donnees.employeIds.map((employeId) => ({ id: crypto.randomUUID(), employeId, evenementId: donnees.evenementId, saisiPar, ...valeursDroit(donnees) }));
    await transaction.insert(droitsConges).values(nouveaux);
    await relierPiecesAuxDroits(transaction, nouveaux.map((droit) => droit.id), pieces, saisiPar);
    return { ok: true, nombre: donnees.employeIds.length, evenementNom: evenement.nom };
  });
}

export type ResultatModification = { ok: true; nom: string } | { ok: false; erreur: "introuvable" | "chevauchement" | "trop_de_pieces" };

/** Modifie un droit ; refuse une nouvelle période qui chevaucherait un autre droit du même employé et événement. */
export async function modifierDroit(id: string, donnees: DonneesDroit, pieces: PieceJointeRecue[], auteur: string): Promise<ResultatModification> {
  return obtenirBase().transaction(async (transaction) => {
    const [droit] = await transaction
      .select({ employeId: droitsConges.employeId, evenementId: droitsConges.evenementId, prenom: employes.prenom, nom: employes.nom })
      .from(droitsConges)
      .innerJoin(employes, eq(employes.id, droitsConges.employeId))
      .where(eq(droitsConges.id, id))
      .for("update");
    if (!droit) return { ok: false, erreur: "introuvable" };

    const autres = await transaction
      .select({ debut: droitsConges.dateDebut, fin: droitsConges.dateFin })
      .from(droitsConges)
      .where(and(eq(droitsConges.employeId, droit.employeId), eq(droitsConges.evenementId, droit.evenementId), ne(droitsConges.id, id)));
    if (autres.some((autre) => periodesSeChevauchent(autre, { debut: donnees.du, fin: donnees.au }))) return { ok: false, erreur: "chevauchement" };

    if ((await compterPiecesDuDroit(transaction, id)) + pieces.length > PIECES_JOINTES_PAR_DROIT_MAX) return { ok: false, erreur: "trop_de_pieces" };
    await transaction.update(droitsConges).set(valeursDroit(donnees)).where(eq(droitsConges.id, id));
    await relierPiecesAuxDroits(transaction, [id], pieces, auteur);
    return { ok: true, nom: `${droit.prenom} ${droit.nom}` };
  });
}

/** Supprime un droit (les absences restent) et ses pièces devenues inutiles. Renvoie false s'il n'existe plus. */
export async function supprimerDroit(id: string): Promise<boolean> {
  return obtenirBase().transaction(async (transaction) => {
    const resultat = await transaction.delete(droitsConges).where(eq(droitsConges.id, id));
    if (!resultat.rowCount) return false;
    await supprimerPiecesOrphelines(transaction);
    return true;
  });
}

/** Confirme un droit provisoire. Renvoie le nom de l'employé, ou null si le droit n'existe plus. */
export async function confirmerDroit(id: string): Promise<string | null> {
  return obtenirBase().transaction(async (transaction) => {
    const [droit] = await transaction
      .select({ prenom: employes.prenom, nom: employes.nom })
      .from(droitsConges)
      .innerJoin(employes, eq(employes.id, droitsConges.employeId))
      .where(eq(droitsConges.id, id))
      .for("update");
    if (!droit) return null;
    await transaction.update(droitsConges).set({ estConfirme: true }).where(eq(droitsConges.id, id));
    return `${droit.prenom} ${droit.nom}`;
  });
}
