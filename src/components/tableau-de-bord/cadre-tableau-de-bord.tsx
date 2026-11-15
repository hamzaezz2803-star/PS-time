"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { PanelLeft, X } from "lucide-react";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";
import { ContexteMenu, useMenu, type EtatMenu } from "./contexte-menu";
import { FilAriane } from "./fil-ariane";
import { Horloge } from "./horloge";
import { MenuLateral } from "./menu-lateral";
import {
  abonnerPreferenceMenu,
  enregistrerPreferenceMenu,
  lirePreferenceMenu,
  lirePreferenceMenuServeur,
} from "./preference-menu";

const ECRAN_ORDINATEUR = "(min-width: 1024px)";
const BOUTON_ICONE =
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:size-9";
const BOUTON_ICONE_MENU =
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-menu-texte-secondaire transition-colors duration-150 hover:bg-menu-survol hover:text-white focus-visible:outline-2 focus-visible:outline-accent";

function Marque() {
  const { estReplie } = useMenu();
  return (
    <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b border-menu-bordure px-3", estReplie && "lg:justify-center lg:px-0")}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-carte">
        <Image src="/logo-ps-time.webp" alt={TEXTES_CONNEXION.altLogo} width={1261} height={1247} sizes="28px" className="size-7" />
      </span>
      <span className={cn("min-w-0", estReplie && "lg:sr-only")}>
        <span className="block truncate text-base font-bold leading-tight tracking-tight text-white">{TEXTES_NAVIGATION.nomApplication}</span>
        <span className="block truncate text-sm leading-tight text-menu-texte-secondaire">{TEXTES_NAVIGATION.sousTitreApplication}</span>
      </span>
    </div>
  );
}

function ContenuMenu({ pied }: { pied: ReactNode }) {
  const { estReplie } = useMenu();
  return (
    <>
      <Marque />
      <div className={cn("flex-1 px-2 py-4", estReplie ? "lg:overflow-visible" : "overflow-y-auto")}>
        <MenuLateral />
      </div>
      <div className="border-t border-menu-bordure p-2">{pied}</div>
    </>
  );
}

/**
 * Cadre des pages connectées : menu latéral sombre (repliable en icônes, Ctrl+B),
 * barre du haut blanche et zone de travail claire, tiroir sur mobile.
 */
export function CadreTableauDeBord({ pied, children }: { pied: ReactNode; children: ReactNode }) {
  const estReplie = useSyncExternalStore(abonnerPreferenceMenu, lirePreferenceMenu, lirePreferenceMenuServeur);
  const [estOuvertMobile, setEstOuvertMobile] = useState(false);

  const basculer = useCallback(() => {
    if (window.matchMedia(ECRAN_ORDINATEUR).matches) {
      enregistrerPreferenceMenu(!lirePreferenceMenu());
    } else {
      setEstOuvertMobile((ouvert) => !ouvert);
    }
  }, []);
  const fermerMobile = useCallback(() => setEstOuvertMobile(false), []);

  useEffect(() => {
    const surTouche = (evenement: KeyboardEvent) => {
      if ((evenement.ctrlKey || evenement.metaKey) && evenement.key.toLowerCase() === "b") {
        evenement.preventDefault();
        basculer();
      }
      if (evenement.key === "Escape") setEstOuvertMobile(false);
    };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [basculer]);

  const etat = useMemo<EtatMenu>(
    () => ({ estReplie, estOuvertMobile, basculer, fermerMobile }),
    [estReplie, estOuvertMobile, basculer, fermerMobile],
  );

  return (
    <ContexteMenu value={etat}>
      <div className="flex min-h-dvh bg-fond">
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col bg-menu-fond transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex",
            estReplie ? "w-[4.5rem]" : "w-64",
          )}
        >
          <ContenuMenu pied={pied} />
        </aside>

        {estOuvertMobile && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={TEXTES_NAVIGATION.menuPrincipal}>
            <div className="absolute inset-0 bg-marine/50" onClick={fermerMobile} aria-hidden="true" />
            <aside className="relative flex h-full w-72 max-w-[85vw] animate-apparition flex-col bg-menu-fond shadow-flottant motion-reduce:animate-none">
              <button type="button" onClick={fermerMobile} aria-label={TEXTES_NAVIGATION.fermerMenu} autoFocus className={cn(BOUTON_ICONE_MENU, "absolute end-2 top-2.5")}>
                <X className="size-5" aria-hidden="true" />
              </button>
              <ContenuMenu pied={pied} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-bordure bg-surface/90 px-2 backdrop-blur sm:px-4 lg:px-6">
            <button type="button" onClick={basculer} aria-label={TEXTES_NAVIGATION.basculerMenu} title={TEXTES_NAVIGATION.basculerMenu} className={BOUTON_ICONE}>
              <PanelLeft className="size-[18px]" aria-hidden="true" />
            </button>
            <span className="h-5 w-px bg-bordure" aria-hidden="true" />
            <div className="ms-1 min-w-0 flex-1">
              <FilAriane />
            </div>
            <Horloge />
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>
    </ContexteMenu>
  );
}
