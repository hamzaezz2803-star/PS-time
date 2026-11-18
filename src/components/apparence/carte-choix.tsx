import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { TEXTES_APPARENCE as textes } from "@/lib/textes/apparence";
import { cn } from "@/lib/utils";

/** Carte d'un choix (bouton radio caché) : bordure épaisse et coche quand elle est choisie, jamais la couleur seule. */
export function CarteChoix({ nom, valeur, estChoisi, onChoisir, libelle, detail, estActuel, children }: {
  nom: string;
  valeur: string;
  estChoisi: boolean;
  onChoisir: () => void;
  libelle: string;
  detail: string;
  estActuel: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded-xl border bg-surface p-4 shadow-carte transition-shadow duration-150 hover:shadow-survol has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primaire",
        estChoisi ? "border-primaire ring-2 ring-primaire" : "border-bordure",
      )}
    >
      <input type="radio" name={nom} value={valeur} checked={estChoisi} onChange={onChoisir} className="sr-only" />
      {children}
      <span className="flex items-start justify-between gap-2">
        <span className="flex flex-col">
          <span className="flex flex-wrap items-center gap-2 text-base font-semibold text-texte">
            {libelle}
            {estActuel && <span className="rounded-md bg-canevas px-2 py-0.5 text-sm font-medium text-texte-secondaire">{textes.actuel}</span>}
          </span>
          <span className="text-sm text-texte-secondaire">{detail}</span>
        </span>
        {estChoisi && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primaire text-white">
            <Check className="size-4" aria-hidden="true" />
          </span>
        )}
      </span>
    </label>
  );
}
