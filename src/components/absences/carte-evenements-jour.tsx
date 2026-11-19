import { CalendarDays } from "lucide-react";
import { Carte } from "@/components/detail-jour/cartes-jour";
import { TEXTES_ABSENCES as textes } from "@/lib/textes/absences";
import type { EvenementDuJour } from "@/types";
import { EvenementAffiche } from "./liste-absences";
import { decrirePeriode } from "./periode-absence";

/** Détail jour : absences et événements de l'employé ce jour-là (congé, maladie, formation...). */
export function CarteEvenementsJour({ evenements }: { evenements: EvenementDuJour[] }) {
  return (
    <Carte titre={textes.carteTitre} Icone={CalendarDays}>
      {evenements.length === 0 ? (
        <p className="text-sm text-texte-secondaire">{textes.carteVide}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-bordure">
          {evenements.map((evenement) => (
            <li key={`${evenement.code}-${evenement.debut}-${evenement.debutMinutes ?? "journee"}`} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <EvenementAffiche code={evenement.code} nom={evenement.nom} type={evenement.type} />
              <span className="flex flex-col text-sm sm:items-end">
                <span className="tabular-nums text-texte">{decrirePeriode(evenement)}</span>
                {evenement.remarque && <span className="text-texte-secondaire">{evenement.remarque}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
