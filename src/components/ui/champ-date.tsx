import { ChampCalendrier, type ProprietesCalendrier } from "./champ-calendrier";
import { Etiquette } from "./etiquette";
import { MessageErreur } from "./message-erreur";

type ProprietesChampDate = Omit<ProprietesCalendrier, "id" | "libelle" | "name" | "aria-invalid" | "aria-describedby"> & {
  nom: string;
  libelle: string;
  aide?: string;
  erreur?: string;
};

/** Champ de date d'un formulaire : libellé au-dessus, calendrier, aide et erreur en dessous (comme ChampFormulaire). */
export function ChampDate({ nom, libelle, aide, erreur, ...proprietes }: ProprietesChampDate) {
  const idAide = aide ? `aide-${nom}` : undefined;
  const idErreur = erreur ? `erreur-${nom}` : undefined;
  const decritPar = [idAide, idErreur].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <Etiquette htmlFor={nom}>{libelle}</Etiquette>
      <ChampCalendrier id={nom} name={nom} libelle={libelle} aria-invalid={erreur ? true : undefined} aria-describedby={decritPar} {...proprietes} />
      {aide && (
        <p id={idAide} className="text-sm text-texte-secondaire">
          {aide}
        </p>
      )}
      <MessageErreur id={idErreur} message={erreur} />
    </div>
  );
}
