import type { InputHTMLAttributes } from "react";
import { ChampSaisie } from "./champ-saisie";
import { Etiquette } from "./etiquette";
import { MessageErreur } from "./message-erreur";

type ProprietesChamp = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name"> & {
  nom: string;
  libelle: string;
  aide?: string;
  erreur?: string;
};

/** Champ texte complet : libellé au-dessus, aide et erreur en dessous, reliés pour les lecteurs d'écran. */
export function ChampFormulaire({ nom, libelle, aide, erreur, ...proprietes }: ProprietesChamp) {
  const idAide = aide ? `aide-${nom}` : undefined;
  const idErreur = erreur ? `erreur-${nom}` : undefined;
  const decritPar = [idAide, idErreur].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <Etiquette htmlFor={nom}>{libelle}</Etiquette>
      <ChampSaisie
        id={nom}
        name={nom}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decritPar}
        {...proprietes}
      />
      {aide && (
        <p id={idAide} className="text-sm text-texte-secondaire">
          {aide}
        </p>
      )}
      <MessageErreur id={idErreur} message={erreur} />
    </div>
  );
}
