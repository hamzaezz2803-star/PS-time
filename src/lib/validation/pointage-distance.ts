import { z } from "zod";
import { ETATS_POINTAGE } from "@/lib/constantes";
import { positionValide, type Position } from "@/lib/metier/pointage-distance";
import type { EtatPointage } from "./pointage";

/** Noms des champs envoyés par l'écran de pointage de l'employé. */
export const CHAMPS_POINTAGE_DISTANCE = {
  etat: "etat",
  latitude: "latitude",
  longitude: "longitude",
  precision: "precision",
  photo: "photo",
} as const;

const schemaEtat = z.enum(ETATS_POINTAGE);
const nombre = z.coerce.number();

export function lireEtatPointage(formulaire: FormData): EtatPointage | null {
  const analyse = schemaEtat.safeParse(formulaire.get(CHAMPS_POINTAGE_DISTANCE.etat));
  return analyse.success ? analyse.data : null;
}

/** Position envoyée par le navigateur (précision arrondie au mètre), ou null si absente ou invalide. */
export function lirePosition(formulaire: FormData): Position | null {
  const champs = [CHAMPS_POINTAGE_DISTANCE.latitude, CHAMPS_POINTAGE_DISTANCE.longitude, CHAMPS_POINTAGE_DISTANCE.precision].map((nom) => formulaire.get(nom));
  if (champs.some((valeur) => typeof valeur !== "string" || valeur.trim() === "")) return null;
  const [latitude, longitude, precision] = champs.map((valeur) => nombre.safeParse(valeur));
  if (!latitude.success || !longitude.success || !precision.success) return null;
  const position = { latitude: latitude.data, longitude: longitude.data, precisionMetres: Math.round(precision.data) };
  return positionValide(position) ? position : null;
}

/** Fichier de la photo, ou null sans fichier (son contenu est vérifié ensuite par sa signature). */
export function lireFichierPhoto(formulaire: FormData): File | null {
  const fichier = formulaire.get(CHAMPS_POINTAGE_DISTANCE.photo);
  return fichier instanceof File && fichier.size > 0 ? fichier : null;
}
