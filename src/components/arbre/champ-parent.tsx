import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";

const ESPACES_PAR_NIVEAU = 4;

export type OptionParent = { id: string; nom: string; profondeur: number };

/** Menu déroulant du parent, indenté selon la profondeur dans l'arbre. */
export function ChampParent({
  libelle,
  aucunParent,
  options,
  valeurInitiale,
  erreur,
}: {
  libelle: string;
  aucunParent: string;
  options: OptionParent[];
  valeurInitiale: string | null;
  erreur?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Etiquette htmlFor="parentId">{libelle}</Etiquette>
      <select
        id="parentId"
        name="parentId"
        defaultValue={valeurInitiale ?? ""}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? "erreur-parent" : undefined}
        className="h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte shadow-[0_1px_2px_rgb(15_27_51/0.04)] focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire aria-invalid:border-erreur lg:h-10"
      >
        <option value="">{aucunParent}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {" ".repeat(option.profondeur * ESPACES_PAR_NIVEAU) + option.nom}
          </option>
        ))}
      </select>
      <MessageErreur id="erreur-parent" message={erreur} />
    </div>
  );
}
