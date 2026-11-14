"use client";

import { CalendarClock, MoonStar } from "lucide-react";
import { supprimerCalendrier } from "@/app/(connecte)/programme/calendriers/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { dureePauseMinutes, dureeTravailMinutes, finLeLendemain, formaterDuree, minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Calendrier } from "@/types";
import { FormulaireCalendrier } from "./formulaire-calendrier";

const textes = TEXTES_PROGRAMME.calendriers;

const COLONNES: ColonneListe<Calendrier>[] = [
  { titre: textes.colonnes.nom, rendu: (calendrier) => calendrier.nom },
  {
    titre: textes.colonnes.horaires,
    rendu: (calendrier) => (
      <span className="inline-flex items-center gap-2 tabular-nums whitespace-nowrap">
        {minutesVersHeure(calendrier.debutMinutes)} – {minutesVersHeure(calendrier.finMinutes)}
        {finLeLendemain(calendrier.debutMinutes, calendrier.finMinutes) && (
          <span className="inline-flex items-center gap-1 rounded-md bg-ciel px-1.5 py-0.5 text-xs font-medium text-marine">
            <MoonStar className="size-3.5" aria-hidden="true" />
            {textes.lendemain}
          </span>
        )}
      </span>
    ),
  },
  {
    titre: textes.colonnes.travail,
    rendu: (calendrier) => (
      <span className="tabular-nums">
        {formaterDuree(
          dureeTravailMinutes(
            calendrier.debutMinutes,
            calendrier.finMinutes,
            dureePauseMinutes(calendrier.pauseDebutMinutes, calendrier.pauseFinMinutes),
          ),
        )}
      </span>
    ),
  },
  {
    titre: textes.colonnes.pause,
    estSecondaire: true,
    rendu: ({ pauseDebutMinutes, pauseFinMinutes }) =>
      pauseDebutMinutes === null || pauseFinMinutes === null ? (
        <span className="text-texte-secondaire">{textes.sansPause}</span>
      ) : (
        <span className="tabular-nums whitespace-nowrap">
          {minutesVersHeure(pauseDebutMinutes)} – {minutesVersHeure(pauseFinMinutes)}
        </span>
      ),
  },
];

/** Liste des calendriers, avec création, modification et suppression en fenêtre. */
export function GestionCalendriers({ calendriers }: { calendriers: Calendrier[] }) {
  return (
    <GestionListe
      elements={calendriers}
      colonnes={COLONNES}
      textes={textes}
      icone={CalendarClock}
      rendreFormulaire={(proprietes) => <FormulaireCalendrier {...proprietes} />}
      actionSupprimer={supprimerCalendrier}
    />
  );
}
