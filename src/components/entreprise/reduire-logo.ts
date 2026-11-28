import { LOGO_ENTREPRISE_COTE_MAX_PIXELS, LOGO_ENTREPRISE_QUALITE_WEBP } from "@/lib/constantes";
import { dimensionsDansCadre } from "@/lib/metier/photo";

/**
 * Réduit le logo choisi pour que son plus grand côté fasse 512 px au plus, proportions et
 * transparence gardées, en WebP, dans le navigateur. Renvoie null si l'image est illisible.
 */
export async function reduireLogo(fichier: File): Promise<File | null> {
  try {
    const image = await createImageBitmap(fichier, { imageOrientation: "from-image" });
    const { largeur, hauteur } = dimensionsDansCadre(image.width, image.height, LOGO_ENTREPRISE_COTE_MAX_PIXELS);

    const toile = document.createElement("canvas");
    toile.width = largeur;
    toile.height = hauteur;
    const contexte = toile.getContext("2d");
    if (!contexte) return null;
    contexte.imageSmoothingQuality = "high";
    contexte.drawImage(image, 0, 0, largeur, hauteur);
    image.close();

    const blob = await new Promise<Blob | null>((resoudre) => toile.toBlob(resoudre, "image/webp", LOGO_ENTREPRISE_QUALITE_WEBP));
    if (!blob) return null;
    // Un navigateur sans encodeur WebP renvoie du PNG : le type réel est gardé.
    const extension = blob.type === "image/webp" ? "webp" : "png";
    return new File([blob], `logo.${extension}`, { type: blob.type });
  } catch {
    return null;
  }
}
