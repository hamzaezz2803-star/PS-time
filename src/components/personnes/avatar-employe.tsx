import Image from "next/image";
import { CHEMIN_PHOTO_EMPLOYE } from "@/lib/constantes";
import { initiales } from "@/lib/formats";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { cn } from "@/lib/utils";

const TAILLES = {
  petite: { classe: "size-8 rounded-md text-sm", pixels: 32 },
  grande: { classe: "size-20 rounded-xl text-2xl", pixels: 80 },
} as const;

/**
 * Photo de profil de l'employé, ou ses initiales s'il n'en a pas. L'adresse change avec la
 * photo (?v=…), donc une nouvelle photo s'affiche aussitôt. Image servie par une route protégée :
 * pas d'optimisation Next (elle n'enverrait pas la session).
 */
export function AvatarEmploye({
  id,
  nomComplet,
  photoModifieeLe,
  taille = "petite",
}: {
  id: string;
  nomComplet: string;
  photoModifieeLe: Date | null;
  taille?: keyof typeof TAILLES;
}) {
  const { classe, pixels } = TAILLES[taille];
  if (photoModifieeLe) {
    return (
      <Image
        src={`${CHEMIN_PHOTO_EMPLOYE(id)}?v=${new Date(photoModifieeLe).getTime()}`}
        alt={TEXTES_PERSONNES.photo.alt(nomComplet)}
        width={pixels}
        height={pixels}
        unoptimized
        className={cn("shrink-0 object-cover ring-1 ring-bordure", classe)}
      />
    );
  }
  return (
    <span className={cn("flex shrink-0 items-center justify-center bg-ciel font-semibold text-marine", classe)} aria-hidden="true">
      {initiales(nomComplet)}
    </span>
  );
}
