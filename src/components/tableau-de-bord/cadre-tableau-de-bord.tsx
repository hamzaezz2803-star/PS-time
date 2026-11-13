"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { MenuLateral } from "./menu-lateral";

function Marque() {
  return (
    <div className="flex items-center gap-3 px-3">
      <Image
        src="/logo-ps-time.webp"
        alt={TEXTES_CONNEXION.altLogo}
        width={1261}
        height={1247}
        sizes="44px"
        className="size-11"
      />
      <span className="text-lg font-bold">{TEXTES_NAVIGATION.nomApplication}</span>
    </div>
  );
}

const BOUTON_ICONE =
  "flex size-11 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Cadre des pages connectées : menu latéral fixe sur ordinateur, tiroir sur mobile.
 * `enTete` (utilisateur, déconnexion) et `children` sont rendus côté serveur.
 */
export function CadreTableauDeBord({
  enTete,
  children,
}: {
  enTete: ReactNode;
  children: ReactNode;
}) {
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const fermer = () => setMenuMobileOuvert(false);

  useEffect(() => {
    if (!menuMobileOuvert) return;
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setMenuMobileOuvert(false);
    };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [menuMobileOuvert]);

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 overflow-y-auto bg-marine px-3 py-4 text-white lg:flex">
        <Marque />
        <MenuLateral onNavigation={() => {}} />
      </aside>

      {menuMobileOuvert && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={TEXTES_NAVIGATION.menuPrincipal}>
          <div className="absolute inset-0 bg-black/40" onClick={fermer} aria-hidden="true" />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto bg-marine px-3 py-4 text-white">
            <div className="flex items-center justify-between">
              <Marque />
              <button
                type="button"
                onClick={fermer}
                aria-label={TEXTES_NAVIGATION.fermerMenu}
                autoFocus
                className={`${BOUTON_ICONE} hover:bg-white/10 focus-visible:outline-white`}
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>
            <MenuLateral onNavigation={fermer} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-bordure bg-surface px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuMobileOuvert(true)}
            aria-label={TEXTES_NAVIGATION.ouvrirMenu}
            aria-expanded={menuMobileOuvert}
            className={`${BOUTON_ICONE} text-marine hover:bg-ciel focus-visible:outline-primaire lg:hidden`}
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
          <div className="ms-auto">{enTete}</div>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
