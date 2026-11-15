import { PHOTO_COTE_PIXELS, PHOTO_QUALITE_WEBP } from "@/lib/constantes";
import { cadrageCarre } from "@/lib/metier/photo";

/**
 * Recadre la photo choisie en carré centré et la réduit à 512 × 512 px en WebP, dans le
 * navigateur : le fichier envoyé reste léger (quelques dizaines de Ko) quelle que soit la photo
 * d'origine. Renvoie null si le navigateur ne sait pas lire l'image.
 */
export async function redimensionnerPhoto(fichier: File): Promise<File | null> {
  try {
    // « from-image » : respecte l'orientation des photos prises au téléphone.
    const image = await createImageBitmap(fichier, { imageOrientation: "from-image" });
    const { x, y, cote } = cadrageCarre(image.width, image.height);
    const sortie = Math.min(cote, PHOTO_COTE_PIXELS);

    const toile = document.createElement("canvas");
    toile.width = sortie;
    toile.height = sortie;
    const contexte = toile.getContext("2d");
    if (!contexte) return null;
    contexte.imageSmoothingQuality = "high";
    contexte.drawImage(image, x, y, cote, cote, 0, 0, sortie, sortie);
    image.close();

    const blob = await new Promise<Blob | null>((resoudre) => toile.toBlob(resoudre, "image/webp", PHOTO_QUALITE_WEBP));
    if (!blob) return null;
    // Un navigateur sans encodeur WebP renvoie du PNG : le type réel est gardé.
    const extension = blob.type === "image/webp" ? "webp" : "png";
    return new File([blob], `photo.${extension}`, { type: blob.type });
  } catch {
    return null;
  }
}
