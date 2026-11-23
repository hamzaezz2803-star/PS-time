import "server-only";

import { and, asc, count, eq, inArray, notExists } from "drizzle-orm";
import { PIECES_JOINTES_PAR_DROIT_MAX } from "@/lib/constantes";
import type { PieceJointeRecue } from "@/lib/validation/piece-jointe";
import type { PieceJointeDroit } from "@/types";
import { obtenirBase } from "./base";
import { droitsConges, droitsCongesPiecesJointes, piecesJointes } from "./schema";

type Transaction = Parameters<Parameters<ReturnType<typeof obtenirBase>["transaction"]>[0]>[0];

/**
 * Enregistre chaque pièce une seule fois et la relie à tous les droits donnés (attribution
 * groupée : un même justificatif pour plusieurs employés). Dans la transaction de l'appelant.
 */
export async function relierPiecesAuxDroits(transaction: Transaction, droitIds: string[], pieces: PieceJointeRecue[], ajoutePar: string) {
  if (pieces.length === 0 || droitIds.length === 0) return;
  const lignes = pieces.map((piece) => ({ id: crypto.randomUUID(), nomFichier: piece.nomFichier, typeMime: piece.type, tailleOctets: piece.contenu.length, contenu: piece.contenu, ajoutePar }));
  await transaction.insert(piecesJointes).values(lignes);
  await transaction.insert(droitsCongesPiecesJointes).values(droitIds.flatMap((droitId) => lignes.map((ligne) => ({ droitId, pieceJointeId: ligne.id }))));
}

/** Nombre de pièces déjà reliées à un droit. */
export async function compterPiecesDuDroit(transaction: Transaction, droitId: string): Promise<number> {
  const [resultat] = await transaction.select({ total: count() }).from(droitsCongesPiecesJointes).where(eq(droitsCongesPiecesJointes.droitId, droitId));
  return resultat?.total ?? 0;
}

/** Supprime les pièces qui ne justifient plus aucun droit (après la suppression d'un droit ou d'un lien). */
export async function supprimerPiecesOrphelines(transaction: Transaction) {
  await transaction
    .delete(piecesJointes)
    .where(notExists(transaction.select({ id: droitsCongesPiecesJointes.pieceJointeId }).from(droitsCongesPiecesJointes).where(eq(droitsCongesPiecesJointes.pieceJointeId, piecesJointes.id))));
}

/** Pièces (sans leur contenu) des droits affichés, par droit, dans l'ordre d'ajout. */
export async function listerPiecesDesDroits(droitIds: string[]): Promise<Map<string, PieceJointeDroit[]>> {
  const parDroit = new Map<string, PieceJointeDroit[]>();
  if (droitIds.length === 0) return parDroit;
  const lignes = await obtenirBase()
    .select({ droitId: droitsCongesPiecesJointes.droitId, id: piecesJointes.id, nomFichier: piecesJointes.nomFichier, typeMime: piecesJointes.typeMime, tailleOctets: piecesJointes.tailleOctets })
    .from(droitsCongesPiecesJointes)
    .innerJoin(piecesJointes, eq(piecesJointes.id, droitsCongesPiecesJointes.pieceJointeId))
    .where(inArray(droitsCongesPiecesJointes.droitId, droitIds))
    .orderBy(asc(piecesJointes.creeLe), asc(piecesJointes.nomFichier));
  for (const { droitId, ...piece } of lignes) parDroit.set(droitId, [...(parDroit.get(droitId) ?? []), piece]);
  return parDroit;
}

/** Contenu d'une pièce jointe, ou null si elle n'existe pas. */
export async function obtenirPieceJointe(id: string): Promise<{ nomFichier: string; typeMime: string; contenu: Buffer } | null> {
  const [piece] = await obtenirBase()
    .select({ nomFichier: piecesJointes.nomFichier, typeMime: piecesJointes.typeMime, contenu: piecesJointes.contenu })
    .from(piecesJointes)
    .where(eq(piecesJointes.id, id))
    .limit(1);
  return piece ?? null;
}

export type ResultatAjoutPieces = { ok: true; nom: string } | { ok: false; erreur: "introuvable" | "trop" };

/** Ajoute des pièces à un droit existant (10 au plus par droit), dans une transaction qui verrouille le droit. */
export async function ajouterPiecesAuDroit(droitId: string, pieces: PieceJointeRecue[], ajoutePar: string): Promise<ResultatAjoutPieces> {
  return obtenirBase().transaction(async (transaction) => {
    const [droit] = await transaction.select({ id: droitsConges.id }).from(droitsConges).where(eq(droitsConges.id, droitId)).for("update");
    if (!droit) return { ok: false, erreur: "introuvable" };
    if ((await compterPiecesDuDroit(transaction, droitId)) + pieces.length > PIECES_JOINTES_PAR_DROIT_MAX) return { ok: false, erreur: "trop" };
    await relierPiecesAuxDroits(transaction, [droitId], pieces, ajoutePar);
    return { ok: true, nom: pieces.map((piece) => piece.nomFichier).join(", ") };
  });
}

/** Retire une pièce d'un droit ; la pièce est supprimée si plus aucun droit ne l'utilise. Renvoie son nom, ou null. */
export async function retirerPieceDuDroit(droitId: string, pieceJointeId: string): Promise<string | null> {
  return obtenirBase().transaction(async (transaction) => {
    const condition = and(eq(droitsCongesPiecesJointes.droitId, droitId), eq(droitsCongesPiecesJointes.pieceJointeId, pieceJointeId));
    const [piece] = await transaction
      .select({ nom: piecesJointes.nomFichier })
      .from(droitsCongesPiecesJointes)
      .innerJoin(piecesJointes, eq(piecesJointes.id, droitsCongesPiecesJointes.pieceJointeId))
      .where(condition)
      .for("update");
    if (!piece) return null;
    await transaction.delete(droitsCongesPiecesJointes).where(condition);
    await supprimerPiecesOrphelines(transaction);
    return piece.nom;
  });
}
