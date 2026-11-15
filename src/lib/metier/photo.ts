/** Règles de la photo de profil. Fonctions pures, testées dans photo.test.ts. */
import { PHOTO_TAILLE_MAX_OCTETS } from "../constantes.ts";

export type TypePhoto = "image/jpeg" | "image/png" | "image/webp";

const commencePar = (octets: Uint8Array, debut: number[], decalage = 0) =>
  debut.every((octet, index) => octets[decalage + index] === octet);

/**
 * Type réel d'une image d'après ses premiers octets (signature), jamais d'après
 * son nom ou le type annoncé par le navigateur. null si ce n'est pas un format accepté.
 */
export function detecterTypePhoto(octets: Uint8Array): TypePhoto | null {
  if (commencePar(octets, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (commencePar(octets, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // « RIFF » + taille sur 4 octets + « WEBP ».
  if (commencePar(octets, [0x52, 0x49, 0x46, 0x46]) && commencePar(octets, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

export type VerificationPhoto = { ok: true; type: TypePhoto } | { ok: false; erreur: "taille" | "format" };

/** Une photo acceptée : non vide, 512 Ko au plus, en JPEG, PNG ou WebP. */
export function verifierPhoto(octets: Uint8Array): VerificationPhoto {
  if (octets.length === 0 || octets.length > PHOTO_TAILLE_MAX_OCTETS) return { ok: false, erreur: "taille" };
  const type = detecterTypePhoto(octets);
  return type ? { ok: true, type } : { ok: false, erreur: "format" };
}

/** Plus grand carré centré dans une image (zone gardée quand on recadre une photo en carré). */
export function cadrageCarre(largeur: number, hauteur: number): { x: number; y: number; cote: number } {
  const cote = Math.min(largeur, hauteur);
  return { x: Math.floor((largeur - cote) / 2), y: Math.floor((hauteur - cote) / 2), cote };
}
