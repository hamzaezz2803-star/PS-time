import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Une part de l'anneau : `trait` est une classe de couleur de trait (ex. `stroke-graphe-retard`). */
export type PartAnneau = { cle: string; libelle: string; valeur: number; trait: string };

/** Écart entre deux parts, en pixels, pour les distinguer sans compter sur la couleur. */
const ECART_PARTS = 2;

/**
 * Graphique en anneau fait main (SVG, sans bibliothèque) : un tout découpé en parts, avec un texte
 * au centre. Le sens est donné par `libelleAccessible` (lecteurs d'écran) et par la légende voisine.
 */
export function Anneau({
  parts,
  libelleAccessible,
  centre,
  taille = 160,
  epaisseur = 18,
  className,
}: {
  parts: PartAnneau[];
  libelleAccessible: string;
  centre?: ReactNode;
  taille?: number;
  epaisseur?: number;
  className?: string;
}) {
  const rayon = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * rayon;
  const total = parts.reduce((somme, part) => somme + part.valeur, 0);
  const visibles = parts.filter((part) => part.valeur > 0);
  const ecart = visibles.length > 1 ? ECART_PARTS : 0;
  let decalage = 0;

  return (
    <div role="img" aria-label={libelleAccessible} className={cn("relative shrink-0", className)} style={{ width: taille, height: taille }}>
      <svg viewBox={`0 0 ${taille} ${taille}`} className="size-full -rotate-90" aria-hidden="true">
        <circle cx={taille / 2} cy={taille / 2} r={rayon} fill="none" strokeWidth={epaisseur} className="stroke-graphe-grille" />
        {total > 0 &&
          visibles.map((part) => {
            const longueur = (part.valeur / total) * circonference;
            const trait = Math.max(longueur - ecart, 1);
            const cercle = (
              <circle
                key={part.cle}
                cx={taille / 2}
                cy={taille / 2}
                r={rayon}
                fill="none"
                strokeWidth={epaisseur}
                strokeDasharray={`${trait} ${circonference - trait}`}
                strokeDashoffset={-decalage}
                className={part.trait}
              >
                <title>{part.libelle}</title>
              </circle>
            );
            decalage += longueur;
            return cercle;
          })}
      </svg>
      {centre && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{centre}</div>}
    </div>
  );
}
