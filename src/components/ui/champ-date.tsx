import { ChampCalendrier, type ProprietesCalendrier } from "./champ-calendrier";
import { Etiquette } from "./etiquette";
import { MessageErreur } from "./message-erreur";

type ProprietesChampDate = Omit<ProprietesCalendrier, "id" | "libelle" | "name" | "aria-invalid" | "aria-describedby"> & {
  nom: string;
  libelle: string;
  erreur?: string;
};

/** Champ de date d'un formulaire : libellé au-dessus, calendrier, erreur en dessous (comme ChampFormulaire). */
export function ChampDate({ nom, libelle, erreur, ...proprietes }: ProprietesChampDate) {
  const idErreur = erreur ? `erreur-${nom}` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Etiquette htmlFor={nom}>{libelle}</Etiquette>
      <ChampCalendrier id={nom} name={nom} libelle={libelle} aria-invalid={erreur ? true : undefined} aria-describedby={idErreur} {...proprietes} />
      <MessageErreur id={idErreur} message={erreur} />
    </div>
  );
}
