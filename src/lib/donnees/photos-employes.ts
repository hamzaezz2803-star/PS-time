import "server-only";

import { eq } from "drizzle-orm";
import type { TypePhoto } from "@/lib/metier/photo";
import { obtenirBase } from "./base";
import { photosEmployes } from "./schema";

/** Photo vérifiée, prête à être enregistrée. */
export type Photo = { type: TypePhoto; octets: Buffer };

/** Ce que le formulaire demande pour la photo d'un employé. */
export type ChangementPhoto = { action: "garder" } | { action: "remplacer"; photo: Photo } | { action: "retirer" };

type Transaction = Parameters<Parameters<ReturnType<typeof obtenirBase>["transaction"]>[0]>[0];

/** Applique le changement de photo dans la transaction de l'employé (tout réussit ou rien). */
export async function appliquerChangementPhoto(transaction: Transaction, employeId: string, changement: ChangementPhoto) {
  if (changement.action === "garder") return;
  await transaction.delete(photosEmployes).where(eq(photosEmployes.employeId, employeId));
  if (changement.action === "remplacer") {
    const { type, octets } = changement.photo;
    await transaction.insert(photosEmployes).values({ employeId, typeMime: type, contenu: octets, tailleOctets: octets.length });
  }
}

/** Photo d'un employé (octets et type), ou null s'il n'en a pas. */
export async function obtenirPhotoEmploye(employeId: string): Promise<{ typeMime: string; contenu: Buffer } | null> {
  const [photo] = await obtenirBase()
    .select({ typeMime: photosEmployes.typeMime, contenu: photosEmployes.contenu })
    .from(photosEmployes)
    .where(eq(photosEmployes.employeId, employeId))
    .limit(1);
  return photo ?? null;
}
