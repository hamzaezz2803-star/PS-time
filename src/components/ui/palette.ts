import type { CouleurRegle } from "@/lib/constantes";

/**
 * Classes de la palette fixe (règles d'horaire dynamique, couleurs du planning) : texte foncé sur
 * fond clair, contrastes vérifiés dans globals.css. Écrites en entier : Tailwind ne repère que
 * les noms de classes complets.
 */
export const CLASSES_PALETTE: Record<CouleurRegle, { teinte: string; pastille: string; echantillon: string; bordure: string }> = {
  bleu: { teinte: "bg-regle-bleu-fond text-regle-bleu", pastille: "bg-regle-bleu-fond text-regle-bleu ring-regle-bleu/30", echantillon: "bg-regle-bleu", bordure: "border-regle-bleu/40" },
  vert: { teinte: "bg-regle-vert-fond text-regle-vert", pastille: "bg-regle-vert-fond text-regle-vert ring-regle-vert/30", echantillon: "bg-regle-vert", bordure: "border-regle-vert/40" },
  orange: { teinte: "bg-regle-orange-fond text-regle-orange", pastille: "bg-regle-orange-fond text-regle-orange ring-regle-orange/30", echantillon: "bg-regle-orange", bordure: "border-regle-orange/40" },
  rouge: { teinte: "bg-regle-rouge-fond text-regle-rouge", pastille: "bg-regle-rouge-fond text-regle-rouge ring-regle-rouge/30", echantillon: "bg-regle-rouge", bordure: "border-regle-rouge/40" },
  turquoise: { teinte: "bg-regle-turquoise-fond text-regle-turquoise", pastille: "bg-regle-turquoise-fond text-regle-turquoise ring-regle-turquoise/30", echantillon: "bg-regle-turquoise", bordure: "border-regle-turquoise/40" },
  rose: { teinte: "bg-regle-rose-fond text-regle-rose", pastille: "bg-regle-rose-fond text-regle-rose ring-regle-rose/30", echantillon: "bg-regle-rose", bordure: "border-regle-rose/40" },
  jaune: { teinte: "bg-regle-jaune-fond text-regle-jaune", pastille: "bg-regle-jaune-fond text-regle-jaune ring-regle-jaune/30", echantillon: "bg-regle-jaune", bordure: "border-regle-jaune/40" },
  ardoise: { teinte: "bg-regle-ardoise-fond text-regle-ardoise", pastille: "bg-regle-ardoise-fond text-regle-ardoise ring-regle-ardoise/30", echantillon: "bg-regle-ardoise", bordure: "border-regle-ardoise/40" },
};
