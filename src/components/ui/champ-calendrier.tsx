"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { formaterJour } from "@/lib/formats";
import { estJourValide } from "@/lib/metier/calendrier";
import { TEXTES_CALENDRIER } from "@/lib/textes/calendrier";
import { cn } from "@/lib/utils";
import { GrilleCalendrier } from "./grille-calendrier";

const textes = TEXTES_CALENDRIER;
/** Écart entre le champ et le calendrier, et marge minimale avec le bord de l'écran (px). */
const ECART_PIXELS = 6;
const MARGE_ECRAN_PIXELS = 8;

export type ProprietesCalendrier = {
  id: string;
  /** Nom du champ, lu avec la date par les lecteurs d'écran (« Du : jeu. 26 nov. 2026 »). */
  libelle: string;
  /** Nom envoyé avec le formulaire (champ caché), facultatif hors formulaire. */
  name?: string;
  /** Jour choisi (« AAAA-MM-JJ », vide = aucun) : champ contrôlé. Sinon `defaultValue`. */
  value?: string;
  defaultValue?: string;
  onChange?: (jour: string) => void;
  /** Aujourd'hui (« AAAA-MM-JJ ») : repère et bouton « Aujourd'hui » ; par défaut, le jour à Casablanca. */
  aujourdhui?: string;
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
  const { id, libelle, name, value, defaultValue = "", onChange, aujourdhui, min, max, required, disabled, className } = proprietes;
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
        aria-label={libelleJour ? textes.ouvrir(libelle, libelleJour) : textes.ouvrirVide(libelle)}
        data-invalide={proprietes["aria-invalid"] ? "" : undefined}
        aria-describedby={proprietes["aria-describedby"]}
        onClick={() => calendrier.current?.togglePopover()}
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-lg border border-bordure-champ bg-surface ps-3 pe-2.5 text-start text-base text-texte shadow-[0_1px_2px_rgb(15_27_51/0.04)] transition-colors duration-150 lg:h-10",
          "hover:border-primaire/60 focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primaire",
          "data-invalide:border-erreur aria-expanded:border-primaire disabled:cursor-not-allowed disabled:opacity-60",
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
