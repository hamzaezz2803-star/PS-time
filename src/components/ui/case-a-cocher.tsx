import type { InputHTMLAttributes } from "react";

/** Case à cocher avec son libellé cliquable (zone de 44 px de haut). */
export function CaseACocher({
  nom,
  libelle,
  ...proprietes
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id" | "name"> & {
  nom: string;
  libelle: string;
}) {
  return (
    <label htmlFor={nom} className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-texte">
      <input
        type="checkbox"
        id={nom}
        name={nom}
        value="oui"
        className="size-5 shrink-0 cursor-pointer rounded accent-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
        {...proprietes}
      />
      {libelle}
    </label>
  );
}
