"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";
import { useMenu } from "./contexte-menu";
import type { Droits } from "@/lib/metier/droits";
import { groupesVisibles, type ElementNavigation, type LienNavigation } from "./navigation";

const LIGNE =
  "group/ligne relative flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm transition-[background-color,box-shadow,color] duration-150 lg:min-h-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primaire";
// Page active : carte blanche en relief et texte en gras (jamais la couleur seule).
const ACTIF = "bg-menu-actif font-semibold text-menu-texte shadow-survol";
const INACTIF = "font-medium text-menu-texte hover:bg-menu-survol hover:shadow-carte";
const SOUS_INACTIF = "font-medium text-menu-texte-secondaire hover:bg-menu-survol hover:text-menu-texte hover:shadow-carte";

/** Info-bulle affichée en mode icônes (survol ou focus clavier). */
function InfoBulle({ children }: { children: ReactNode }) {
  const { estReplie } = useMenu();
  if (!estReplie) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute start-full top-1/2 z-50 ms-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-texte px-2.5 py-1.5 text-sm font-medium text-white shadow-flottant group-hover/ligne:lg:block group-focus-visible/ligne:lg:block"
    >
      {children}
    </span>
  );
}

function Libelle({ children }: { children: ReactNode }) {
  const { estReplie } = useMenu();
  return <span className={cn("flex-1 truncate text-start", estReplie && "lg:sr-only")}>{children}</span>;
}

function SousLien({ lien, chemin }: { lien: LienNavigation; chemin: string }) {
  const { fermerMobile } = useMenu();
  const estActif = Boolean(lien.href && chemin.startsWith(lien.href));

  if (!lien.href) {
    return (
      <span className={cn(LIGNE, "cursor-default text-menu-texte-secondaire")}>
        <span className="flex-1 truncate">{lien.libelle}</span>
        <span className="rounded-md bg-surface px-1.5 text-sm text-menu-texte-secondaire ring-1 ring-menu-bordure">{TEXTES_NAVIGATION.bientot}</span>
      </span>
    );
  }

  return (
    <Link
      href={lien.href}
      onClick={fermerMobile}
      aria-current={estActif ? "page" : undefined}
      className={cn(LIGNE, estActif ? ACTIF : SOUS_INACTIF)}
    >
      <span className="truncate">{lien.libelle}</span>
    </Link>
  );
}

function Element({ element, chemin }: { element: ElementNavigation; chemin: string }) {
  const { estReplie, basculer, fermerMobile } = useMenu();
  const contientPageActive = Boolean(
    element.sousLiens?.some((lien) => lien.href && chemin.startsWith(lien.href)),
  );
  const [estOuvert, setEstOuvert] = useState(true);
  const Icone = element.icone;

  if (element.href) {
    const estActif = chemin === element.href;
    return (
      <Link
        href={element.href}
        onClick={fermerMobile}
        aria-current={estActif ? "page" : undefined}
        aria-label={estReplie ? element.libelle : undefined}
        className={cn(LIGNE, estActif ? ACTIF : INACTIF)}
      >
        <Icone className="size-[18px] shrink-0" aria-hidden="true" />
        <Libelle>{element.libelle}</Libelle>
        <InfoBulle>{element.libelle}</InfoBulle>
      </Link>
    );
  }

  const idSousMenu = `sous-menu-${element.libelle}`;
  // Replié, l'icône d'une section rouvre le menu pour montrer ses pages.
  const surClic = () => (estReplie ? (basculer(), setEstOuvert(true)) : setEstOuvert((o) => !o));

  return (
    <>
      <button
        type="button"
        onClick={surClic}
        aria-expanded={estReplie ? false : estOuvert}
        aria-controls={idSousMenu}
        aria-label={estReplie ? element.libelle : undefined}
        className={cn(LIGNE, contientPageActive && estReplie ? ACTIF : INACTIF, contientPageActive && "font-semibold")}
      >
        <Icone className="size-[18px] shrink-0" aria-hidden="true" />
        <Libelle>{element.libelle}</Libelle>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-menu-texte-secondaire transition-transform duration-150 motion-reduce:transition-none",
            estOuvert && "rotate-180",
            estReplie && "lg:hidden",
          )}
          aria-hidden="true"
        />
        <InfoBulle>{element.libelle}</InfoBulle>
      </button>
      {estOuvert && (
        <ul
          id={idSousMenu}
          className={cn("ms-[1.3rem] mt-1 flex flex-col gap-1", estReplie && "lg:hidden")}
        >
          {element.sousLiens?.map((lien) => (
            // Trait vertical continu (sauf après le dernier) et coude arrondi vers chaque page.
            <li
              key={lien.libelle}
              className="relative ps-4 before:absolute before:start-0 before:top-0 before:h-1/2 before:w-3 before:rounded-es-lg before:border-b before:border-s before:border-menu-bordure after:absolute after:inset-y-0 after:start-0 after:border-s after:border-menu-bordure last:after:hidden"
            >
              <SousLien lien={lien} chemin={chemin} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Groupes de liens du menu latéral (ordinateur et tiroir mobile), selon les droits du compte. */
export function MenuLateral({ droits }: { droits: Droits }) {
  const chemin = usePathname();
  const { estReplie } = useMenu();

  return (
    <nav aria-label={TEXTES_NAVIGATION.menuPrincipal} className="flex flex-col gap-6">
      {groupesVisibles(droits).map((groupe) => (
        <div key={groupe.titre} className="flex flex-col gap-1">
          <p
            className={cn(
              "px-3 pb-1 text-sm font-semibold uppercase tracking-wider text-menu-texte-secondaire",
              estReplie && "lg:sr-only",
            )}
          >
            {groupe.titre}
          </p>
          <ul className="flex flex-col gap-0.5">
            {groupe.elements.map((element) => (
              <li key={element.libelle}>
                <Element element={element} chemin={chemin} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
