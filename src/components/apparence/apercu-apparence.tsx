import type { CSSProperties } from "react";
import type { Apparence, Theme } from "@/lib/metier/apparence";
import { variablesCouleurs, type CouleursPersonnalisees } from "@/lib/metier/couleurs";
import { TEXTES_APPARENCE as textes } from "@/lib/textes/apparence";

/**
 * Attributs qui donnent à un élément les couleurs d'un thème : `data-theme` (lu par globals.css),
 * ou les variables du thème personnalisé posées sur l'élément.
 */
export function attributsTheme(theme: Theme, couleurs: CouleursPersonnalisees): { "data-theme": Theme; style?: CSSProperties } {
  return theme === "personnalise"
    ? { "data-theme": theme, style: variablesCouleurs(couleurs) as CSSProperties }
    : { "data-theme": theme };
}

/** Nuancier d'un thème : les couleurs viennent des variables du thème, aucune n'est écrite ici. */
export function Nuancier({ theme, couleurs }: { theme: Theme; couleurs: CouleursPersonnalisees }) {
  return (
    <span {...attributsTheme(theme, couleurs)} className="flex h-10 overflow-hidden rounded-lg ring-1 ring-bordure" aria-hidden="true">
      <span className="flex-[2] bg-marine" />
      <span className="flex-[2] bg-primaire" />
      <span className="flex-1 bg-accent" />
      <span className="flex-[2] bg-ciel" />
      <span className="flex-1 bg-fond" />
    </span>
  );
}

/** Aperçu d'une carte de l'application avec tous les choix en cours (couleurs, police, taille). */
export function ApercuApparence({ theme, police, taille, couleurs }: Apparence) {
  return (
    <div {...attributsTheme(theme, couleurs)} data-police={police} className="overflow-hidden rounded-xl border border-bordure bg-fond font-sans">
      <div data-apercu-taille={taille} className="flex flex-col gap-3 p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-primaire">{textes.apercu}</p>
        <div className="flex flex-col gap-3 rounded-lg border border-bordure bg-surface p-4 shadow-carte">
          <p className="text-lg font-bold text-marine">{textes.exempleTitre}</p>
          <p className="text-base tabular-nums text-texte-secondaire">{textes.exempleTexte}</p>
          <p className="w-fit rounded-md bg-ciel px-2 py-1 text-sm font-medium text-primaire">{textes.exempleLien}</p>
          <span className="inline-flex h-10 w-fit items-center rounded-lg bg-primaire px-4 text-sm font-semibold text-white">{textes.exempleBouton}</span>
        </div>
      </div>
    </div>
  );
}
