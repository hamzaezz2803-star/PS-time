"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { FUSEAU_HORAIRE } from "@/lib/constantes";
import { formaterJour, formaterMois } from "@/lib/formats";
import { bornerJour, estDansBornes, estJourValide, grilleCalendrier, jourApresTouche, moisDuJour, moisVoisin } from "@/lib/metier/calendrier";
import { jourDansFuseau } from "@/lib/metier/dates";
import { TEXTES_CALENDRIER } from "@/lib/textes/calendrier";
import { cn } from "@/lib/utils";
import { BoutonIcone } from "./bouton-icone";

const textes = TEXTES_CALENDRIER;

/** Contenu du calendrier ouvert (rendu seulement une fois ouvert, dans le navigateur) : mois, grille des jours au clavier, puis Effacer et Aujourd'hui. */
export function GrilleCalendrier({
  jour,
  aujourdhui = jourDansFuseau(new Date(), FUSEAU_HORAIRE),
  min,
  max,
  required,
  onChoisir,
  onEchap,
}: {
  jour: string;
  aujourdhui?: string;
  min?: string;
  max?: string;
  required?: boolean;
  onChoisir: (jour: string) => void;
  onEchap: () => void;
}) {
  const depart = bornerJour(estJourValide(jour) ? jour : aujourdhui, min, max);
  const [actif, setActif] = useState(depart);
  const [mois, setMois] = useState(moisDuJour(depart));
  const grille = useRef<HTMLDivElement>(null);
  const doitFocaliser = useRef(true);

  useEffect(() => {
    if (!doitFocaliser.current) return;
    grille.current?.querySelector<HTMLButtonElement>(`[data-jour="${actif}"]`)?.focus();
  }, [actif, mois]);

  const activer = (nouveau: string) => {
    doitFocaliser.current = true;
    setActif(nouveau);
    setMois(moisDuJour(nouveau));
  };

  const changerMois = (decalage: number) => {
    doitFocaliser.current = false;
    setMois((actuel) => moisVoisin(actuel, decalage));
  };

  const surTouche = (evenement: KeyboardEvent<HTMLDivElement>) => {
    if (evenement.key === "Escape") {
      // Ne ferme que le calendrier, pas la fenêtre modale qui le contient.
      evenement.preventDefault();
      evenement.stopPropagation();
      return onEchap();
    }
    const suivant = jourApresTouche(actif, evenement.key);
    if (!suivant) return;
    evenement.preventDefault();
    activer(bornerJour(suivant, min, max));
  };

  const aujourdhuiPermis = estDansBornes(aujourdhui, min, max);
  const semaines = grilleCalendrier(mois);
  const premierDuMois = `${mois}-01`;

  return (
    <div onKeyDown={surTouche} className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1 px-1">
        <BoutonIcone libelle={textes.moisPrecedent} Icone={ChevronLeft} onClick={() => changerMois(-1)} disabled={Boolean(min) && premierDuMois <= (min ?? "")} />
        <p className="text-base font-semibold capitalize text-marine" aria-live="polite">
          {formaterMois(mois)}
        </p>
        <BoutonIcone libelle={textes.moisSuivant} Icone={ChevronRight} onClick={() => changerMois(1)} disabled={Boolean(max) && moisVoisin(mois, 1) > moisDuJour(max ?? "")} />
      </div>

      <div ref={grille} role="grid" aria-label={formaterMois(mois)} className="flex flex-col">
        <div role="row" className="grid grid-cols-7">
          {textes.joursSemaine.map((nom, rang) => (
            <span key={nom} role="columnheader" aria-label={textes.joursSemaineLongs[rang]} className="flex h-8 items-center justify-center text-xs font-semibold uppercase text-texte-secondaire">
              {nom}
            </span>
          ))}
        </div>
        {semaines.map((semaine) => (
          <div key={semaine[0].jour} role="row" className="grid grid-cols-7">
            {semaine.map(({ jour: caseJour, estDuMois }) => {
              const estChoisi = caseJour === jour;
              const estAujourdhui = caseJour === aujourdhui;
              const estPermis = estDansBornes(caseJour, min, max);
              return (
                <span key={caseJour} role="gridcell" aria-selected={estChoisi} className="flex items-center justify-center">
                  <button
                    type="button"
                    data-jour={caseJour}
                    tabIndex={caseJour === actif ? 0 : -1}
                    disabled={!estPermis}
                    aria-label={formaterJour(caseJour)}
                    aria-current={estAujourdhui ? "date" : undefined}
                    onClick={() => onChoisir(caseJour)}
                    onFocus={() => setActif(caseJour)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-lg text-sm tabular-nums transition-colors duration-150 lg:size-9",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primaire",
                      estChoisi
                        ? "bg-primaire font-semibold text-white hover:bg-primaire-survol"
                        : cn(
                            "hover:bg-ciel hover:text-primaire",
                            estDuMois ? "text-texte" : "text-texte-secondaire/70",
                            estAujourdhui && "font-semibold text-primaire ring-1 ring-inset ring-primaire",
                          ),
                      "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-texte-secondaire/40 disabled:line-through",
                    )}
                  >
                    {Number(caseJour.slice(8, 10))}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-bordure px-1 pt-2">
        {required ? (
          <span />
        ) : (
          <button type="button" onClick={() => onChoisir("")} className="min-h-11 rounded-md px-2 text-sm font-medium text-texte-secondaire hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9">
            {textes.effacer}
          </button>
        )}
        <button
          type="button"
          onClick={() => onChoisir(aujourdhui)}
          disabled={!aujourdhuiPermis}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-9"
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          {textes.aujourdhui}
        </button>
      </div>
      <p className="sr-only">{textes.aide}</p>
    </div>
  );
}
