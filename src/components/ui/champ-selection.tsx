import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Etiquette } from "./etiquette";
import { MessageErreur } from "./message-erreur";

export type OptionSelection = { valeur: string; libelle: string };

type ProprietesSelection = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "name"> & {
  nom: string;
  libelle: string;
  options: OptionSelection[];
  /** Première option, sans valeur (« Non précisé », « Choisir... »). */
  optionVide?: string;
  erreur?: string;
};

/** Liste déroulante complète : libellé au-dessus, erreur en dessous, reliés pour les lecteurs d'écran. */
export function ChampSelection({
  nom,
  libelle,
  options,
  optionVide,
  erreur,
  className,
  ...proprietes
}: ProprietesSelection) {
  const idErreur = erreur ? `erreur-${nom}` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Etiquette htmlFor={nom}>{libelle}</Etiquette>
      <select
        id={nom}
        name={nom}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={idErreur}
        className={cn(
          "h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte shadow-[0_1px_2px_rgb(15_27_51/0.04)] lg:h-10",
          "focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire",
          "aria-invalid:border-erreur disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...proprietes}
      >
        {optionVide !== undefined && <option value="">{optionVide}</option>}
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.libelle}
          </option>
        ))}
      </select>
      <MessageErreur id={idErreur} message={erreur} />
    </div>
  );
}

