/** Règles des pièces justificatives (PDF ou image). Fonctions pures, testées dans pieces-jointes.test.ts. */
import { LONGUEUR_MAX_NOM_PIECE_JOINTE, PIECE_JOINTE_TAILLE_MAX_OCTETS, TYPES_PIECE_JOINTE } from "../constantes.ts";
import { detecterTypePhoto } from "./photo.ts";

export type TypePieceJointe = (typeof TYPES_PIECE_JOINTE)[number];

/** « %PDF- » : début de tout fichier PDF. */
const SIGNATURE_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

/**
 * Type réel d'une pièce d'après ses premiers octets (signature), jamais d'après son nom ou le
 * type annoncé par le navigateur. null si ce n'est ni un PDF ni une image acceptée.
 */
export function detecterTypePieceJointe(octets: Uint8Array): TypePieceJointe | null {
  if (SIGNATURE_PDF.every((octet, index) => octets[index] === octet)) return "application/pdf";
  return detecterTypePhoto(octets);
}

export type VerificationPieceJointe = { ok: true; type: TypePieceJointe } | { ok: false; erreur: "taille" | "format" };

/** Une pièce acceptée : non vide, 2 Mo au plus, PDF, PNG, JPEG ou WebP. */
export function verifierPieceJointe(octets: Uint8Array): VerificationPieceJointe {
  if (octets.length === 0 || octets.length > PIECE_JOINTE_TAILLE_MAX_OCTETS) return { ok: false, erreur: "taille" };
  const type = detecterTypePieceJointe(octets);
  return type ? { ok: true, type } : { ok: false, erreur: "format" };
}

/**
 * Nom de fichier affichable et sans danger : sans chemin, sans caractère de contrôle ni guillemet,
 * espaces resserrés, 150 caractères au plus (l'extension est gardée). « piece-jointe » s'il ne reste rien.
 */
export function nettoyerNomFichier(nom: string): string {
  const sansChemin = nom.split(/[/\\]/).pop() ?? "";
  const propre = sansChemin.replace(/[\u0000-\u001f\u007f"<>|*?:]/g, "").replace(/\s+/g, " ").trim();
  if (propre === "" || /^\.+$/.test(propre)) return "piece-jointe";
  if (propre.length <= LONGUEUR_MAX_NOM_PIECE_JOINTE) return propre;
  const point = propre.lastIndexOf(".");
  const extension = point > 0 && propre.length - point <= 6 ? propre.slice(point) : "";
  return propre.slice(0, LONGUEUR_MAX_NOM_PIECE_JOINTE - extension.length) + extension;
}

/** En-tête Content-Disposition (affichage dans le navigateur) avec le nom encodé (RFC 6266). */
export function dispositionEnLigne(nom: string): string {
  const ascii = nom.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nom)}`;
}
