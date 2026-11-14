import type { InputHTMLAttributes } from "react";

/** Case à cocher avec son libellé cliquable (zone de 44 px de haut) et une aide facultative. */
export function CaseACocher({
  nom,
  libelle,
  aide,
  ...proprietes
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id" | "name"> & {
  nom: string;
  libelle: string;
  aide?: string;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={nom} className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-texte">
        <input
          type="checkbox"
          id={nom}
          name={nom}
          value="oui"
          aria-describedby={aide ? `aide-${nom}` : undefined}
          className="size-5 shrink-0 cursor-pointer rounded accent-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
          {...proprietes}
        />
        {libelle}
      </label>
      {aide && (
        <p id={`aide-${nom}`} className="ms-8 text-sm text-texte-secondaire">
          {aide}
        </p>
      )}
    </div>
  );
}
