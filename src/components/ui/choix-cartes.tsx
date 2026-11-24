"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type OptionCarte<V extends string> = { valeur: V; libelle: string; Icone: LucideIcon; aide?: string };

/** Choix unique présenté en grandes cartes (boutons radio, zone cliquable confortable, focus visible). */
export function ChoixCartes<V extends string>({
  nom,
  legende,
  options,
  valeur,
  onChanger,
  classeGrille = "grid-cols-2",
}: {
  nom: string;
  legende: string;
  options: OptionCarte<V>[];
  valeur: V;
  onChanger: (valeur: V) => void;
  /** Colonnes de la grille des cartes (deux par défaut). */
  classeGrille?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-texte">{legende}</legend>
      <div className={cn("grid gap-2", classeGrille)}>
        {options.map(({ valeur: option, libelle, Icone, aide }) => (
          <label
            key={option}
            className={cn(
              // `relative` : le bouton radio masqué (position absolue) reste dans sa carte ; sinon le
              // navigateur fait défiler la fenêtre modale (overflow-hidden) pour l'atteindre et la vide.
              "relative flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-base font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primaire",
              valeur === option ? "border-primaire bg-ciel text-marine" : "border-bordure-champ bg-surface text-texte hover:bg-fond",
            )}
          >
            <input type="radio" name={nom} value={option} checked={valeur === option} onChange={() => onChanger(option)} className="sr-only" />
            <Icone className="size-5 shrink-0" aria-hidden="true" />
            <span className="flex flex-col">
              {libelle}
              {aide && <span className="text-sm font-normal text-texte-secondaire">{aide}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
