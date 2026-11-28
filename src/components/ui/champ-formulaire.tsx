import type { InputHTMLAttributes } from "react";
import { ChampSaisie } from "./champ-saisie";
import { Etiquette } from "./etiquette";
import { MessageErreur } from "./message-erreur";

type ProprietesChamp = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name"> & {
  nom: string;
  /** Nom envoyé avec le formulaire, s'il diffère de `nom` (ex. lignes répétées d'une liste). */
  nomEnvoi?: string;
  libelle: string;
  erreur?: string;
};

/** Champ texte complet : libellé au-dessus, erreur en dessous, reliés pour les lecteurs d'écran. */
export function ChampFormulaire({ nom, nomEnvoi, libelle, erreur, ...proprietes }: ProprietesChamp) {
  const idErreur = erreur ? `erreur-${nom}` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Etiquette htmlFor={nom}>{libelle}</Etiquette>
      <ChampSaisie
        id={nom}
        name={nomEnvoi ?? nom}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={idErreur}
        {...proprietes}
      />
      <MessageErreur id={idErreur} message={erreur} />
    </div>
  );
}
