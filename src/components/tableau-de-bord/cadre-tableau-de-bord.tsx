"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { CHEMIN_ESPACE } from "@/lib/constantes";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";
import { MENUS_VISIBLES } from "./barre-navigation";
import { ContexteMenu, type EtatMenu } from "./contexte-menu";
import { FilAriane } from "./fil-ariane";
import { Horloge } from "./horloge";
import { Notifications } from "./notifications";

const BOUTON_ICONE =
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire";

function Marque() {
  return (
    <Link
      href={CHEMIN_ESPACE}
      className="flex shrink-0 items-center gap-2.5 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-primaire"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface p-1 shadow-carte ring-1 ring-bordure">
        <Image src="/logo-ps-time.webp" alt={TEXTES_CONNEXION.altLogo} width={1155} height={1163} sizes="28px" className="size-7" />
      </span>
      <span className="hidden min-w-0 sm:block xl:hidden 2xl:block">
        <span className="block text-base font-bold leading-tight tracking-tight text-marine">{TEXTES_NAVIGATION.nomApplication}</span>
        <span className="block text-sm leading-tight text-texte-secondaire">{TEXTES_NAVIGATION.sousTitreApplication}</span>
      </span>
    </Link>
  );
}

/**
 * Cadre des pages connectées : barre de navigation blanche en haut (menus déroulants sur
 * ordinateur, tiroir sur mobile), fil d'Ariane, puis zone de travail claire.
 */
export function CadreTableauDeBord({ navigation, compte, children }: { navigation: ReactNode; compte: ReactNode; children: ReactNode }) {
  const [estOuvertMobile, setEstOuvertMobile] = useState(false);
  const basculerMobile = useCallback(() => setEstOuvertMobile((ouvert) => !ouvert), []);
  const fermerMobile = useCallback(() => setEstOuvertMobile(false), []);
  const etat = useMemo<EtatMenu>(() => ({ estOuvertMobile, basculerMobile, fermerMobile }), [estOuvertMobile, basculerMobile, fermerMobile]);

  return (
    <ContexteMenu value={etat}>
      <div className="flex min-h-dvh flex-col bg-fond">
        <header className="sticky top-0 z-30 border-b border-bordure bg-surface/95 backdrop-blur">
          <div className="flex h-16 items-center gap-2 px-2 sm:px-4 lg:gap-3 lg:px-6">
            <button
              type="button"
              onClick={basculerMobile}
              aria-label={TEXTES_NAVIGATION.ouvrirMenu}
              aria-expanded={estOuvertMobile}
              className={cn(BOUTON_ICONE, "xl:hidden in-data-[taille=tres_grande]:max-2xl:flex")}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <Marque />
            <span className={cn("h-6 w-px bg-bordure", MENUS_VISIBLES)} aria-hidden="true" />
            <div className="min-w-0 flex-1">{navigation}</div>
            <Notifications />
            <span className="hidden xl:block">
              <Horloge />
            </span>
            {compte}
          </div>
        </header>
        <div className="border-b border-bordure bg-surface/60 px-4 py-2.5 empty:hidden sm:px-6 lg:px-10">
          <FilAriane />
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </ContexteMenu>
  );
}
