"use client";

import { Search, X } from "lucide-react";
import { TEXTES_LISTE } from "@/lib/textes/liste";
import { cn } from "@/lib/utils";
import { ChampSaisie } from "./champ-saisie";

/** Champ de recherche avec loupe et bouton pour l'effacer. Le libellé est porté par `libelle`. */
export function ChampRecherche({
  id,
  libelle,
  valeur,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  libelle: string;
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-texte-secondaire" aria-hidden="true" />
      <ChampSaisie
        id={id}
        type="search"
        aria-label={libelle}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="ps-9 pe-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {valeur && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={TEXTES_LISTE.effacerRecherche}
          className="absolute end-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-texte-secondaire hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:size-8"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
