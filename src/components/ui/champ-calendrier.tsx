"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formaterJour, formaterMois } from "@/lib/formats";
import { bornerJour, estDansBornes, estJourValide, grilleCalendrier, jourApresTouche, moisDuJour, moisVoisin } from "@/lib/metier/calendrier";
import { TEXTES_CALENDRIER } from "@/lib/textes/calendrier";
import { cn } from "@/lib/utils";
import { BoutonIcone } from "./bouton-icone";

const textes = TEXTES_CALENDRIER;
/** Écart entre le champ et le calendrier, et marge minimale avec le bord de l'écran (px). */
const ECART_PIXELS = 6;
const MARGE_ECRAN_PIXELS = 8;

export type ProprietesCalendrier = {
  id: string;
  /** Nom envoyé avec le formulaire (champ caché), facultatif hors formulaire. */
  name?: string;
  /** Jour choisi (« AAAA-MM-JJ », vide = aucun) : champ contrôlé. Sinon `defaultValue`. */
  value?: string;
  defaultValue?: string;
  onChange?: (jour: string) => void;
  /** Aujourd'hui (« AAAA-MM-JJ ») : repère du calendrier et bouton « Aujourd'hui ». */
  aujourdhui: string;
  min?: string;
  max?: string;
  /** Obligatoire : pas de bouton « Effacer ». */
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/**
 * Champ de date avec un calendrier maison (même rendu sur tous les navigateurs) : bouton qui
 * affiche la date en clair, calendrier du lundi au dimanche dans la couche supérieure du
 * navigateur (au-dessus des fenêtres modales), utilisable entièrement au clavier.
 */
export function ChampCalendrier(proprietes: ProprietesCalendrier) {
  const { id, name, value, defaultValue = "", onChange, aujourdhui, min, max, required, disabled, className } = proprietes;
  const [jourInterne, setJourInterne] = useState(defaultValue);
  const jour = value ?? jourInterne;
  const champ = useRef<HTMLInputElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const calendrier = useRef<HTMLDivElement>(null);
  const [estOuvert, setEstOuvert] = useState(false);
  const idCalendrier = useId();

  const choisir = (nouveau: string) => {
    if (value === undefined) setJourInterne(nouveau);
    onChange?.(nouveau);
  };

  // Champ non contrôlé : la remise à zéro du formulaire rend la valeur de départ.
  useEffect(() => {
    const formulaire = champ.current?.form;
    if (!formulaire || value !== undefined) return;
    const remettre = () => setJourInterne(defaultValue);
    formulaire.addEventListener("reset", remettre);
    return () => formulaire.removeEventListener("reset", remettre);
  }, [defaultValue, value]);

  const positionner = useCallback(() => {
    const bouton = declencheur.current?.getBoundingClientRect();
    const fenetre = calendrier.current;
    if (!bouton || !fenetre) return;
    const { width, height } = fenetre.getBoundingClientRect();
    const placeDessous = window.innerHeight - bouton.bottom - ECART_PIXELS;
    const haut = placeDessous >= height || bouton.top < height ? bouton.bottom + ECART_PIXELS : bouton.top - ECART_PIXELS - height;
    const gauche = Math.min(Math.max(bouton.left, MARGE_ECRAN_PIXELS), window.innerWidth - width - MARGE_ECRAN_PIXELS);
    fenetre.style.top = `${Math.max(haut, MARGE_ECRAN_PIXELS)}px`;
    fenetre.style.left = `${Math.max(gauche, MARGE_ECRAN_PIXELS)}px`;
  }, []);

  useEffect(() => {
    if (!estOuvert) return;
    positionner();
    window.addEventListener("resize", positionner);
    window.addEventListener("scroll", positionner, true);
    return () => {
      window.removeEventListener("resize", positionner);
      window.removeEventListener("scroll", positionner, true);
    };
  }, [estOuvert, positionner]);

  const fermer = (rendreLeFocus: boolean) => {
    calendrier.current?.hidePopover();
    if (rendreLeFocus) declencheur.current?.focus();
  };

  const libelleJour = jour && estJourValide(jour) ? formaterJour(jour) : null;

  return (
    <div className={cn("relative", className)}>
      <input ref={champ} type="hidden" name={name} value={jour} />
      <button
        ref={declencheur}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={estOuvert}
        aria-controls={idCalendrier}
        aria-label={libelleJour ? textes.ouvrir(libelleJour) : textes.ouvrirVide}
        aria-invalid={proprietes["aria-invalid"]}
        aria-describedby={proprietes["aria-describedby"]}
        aria-required={required}
        onClick={() => calendrier.current?.togglePopover()}
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-lg border border-bordure-champ bg-surface ps-3 pe-2.5 text-start text-base text-texte shadow-[0_1px_2px_rgb(15_27_51/0.04)] transition-colors duration-150 lg:h-10",
          "hover:border-primaire/60 focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primaire",
          "aria-invalid:border-erreur aria-expanded:border-primaire disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <CalendarDays className="size-5 shrink-0 text-primaire" aria-hidden="true" />
        <span className={cn("min-w-0 flex-1 truncate tabular-nums", !libelleJour && "text-texte-secondaire")}>{libelleJour ?? textes.choisir}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-texte-secondaire transition-transform duration-150 motion-reduce:transition-none", estOuvert && "rotate-180")} aria-hidden="true" />
      </button>

      <div
        ref={calendrier}
        id={idCalendrier}
        popover="auto"
        role="dialog"
        aria-label={textes.fenetre}
        onToggle={(evenement) => setEstOuvert(evenement.newState === "open")}
        className="fixed inset-auto m-0 w-[20.75rem] max-w-[calc(100vw-1rem)] overflow-visible rounded-xl border border-bordure bg-surface p-2 text-texte shadow-flottant lg:w-[18rem]"
      >
        {estOuvert && (
          <GrilleCalendrier
            jour={jour}
            aujourdhui={aujourdhui}
            min={min}
            max={max}
            required={required}
            onChoisir={(nouveau) => {
              choisir(nouveau);
              fermer(true);
            }}
            onEchap={() => fermer(true)}
          />
        )}
      </div>
    </div>
  );
}

/** Contenu du calendrier ouvert : mois, grille des jours au clavier, puis Effacer et Aujourd'hui. */
function GrilleCalendrier({
  jour,
  aujourdhui,
  min,
  max,
  required,
  onChoisir,
  onEchap,
}: {
  jour: string;
  aujourdhui: string;
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
