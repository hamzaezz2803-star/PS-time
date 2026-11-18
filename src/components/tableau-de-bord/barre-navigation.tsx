"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useMenuDeroulant } from "@/components/ui/utiliser-menu-deroulant";
import type { Droits } from "@/lib/metier/droits";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";
import { estLienActif, menusVisibles, type MenuNavigation } from "./navigation";
import { TiroirNavigation } from "./tiroir-navigation";

// Entrée active : texte en gras et trait sous l'entrée (jamais la couleur seule).
const ENTREE =
  "relative flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire";
const ENTREE_ACTIVE =
  "font-semibold text-marine after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-primaire";
const LIEN_SOUS_MENU =
  "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-texte transition-colors duration-150 hover:bg-canevas focus-visible:outline-2 focus-visible:outline-primaire";

function MenuDeroulant({ menu, chemin }: { menu: MenuNavigation; chemin: string }) {
  const { estOuvert, basculer, fermer, conteneur } = useMenuDeroulant();
  const sections = menu.sections ?? [];
  const contientPageActive = sections.some((section) => section.liens.some((lien) => estLienActif(lien.href, chemin)));
  const idPanneau = `menu-${menu.libelle}`;
  const Icone = menu.icone;

  return (
    <div ref={conteneur} className="relative">
      <button
        type="button"
        onClick={basculer}
        aria-expanded={estOuvert}
        aria-controls={idPanneau}
        className={cn(ENTREE, contientPageActive && ENTREE_ACTIVE, estOuvert && "bg-canevas text-texte")}
      >
        <Icone className="size-4 shrink-0" aria-hidden="true" />
        {menu.libelle}
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none", estOuvert && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {estOuvert && (
        <div
          id={idPanneau}
          className="absolute start-0 top-full z-40 mt-2 flex w-72 animate-apparition flex-col gap-1 rounded-xl bg-surface p-2 shadow-flottant ring-1 ring-bordure motion-reduce:animate-none"
        >
          {sections.map((section, rang) => (
            <div key={section.titre ?? rang} className={cn("flex flex-col gap-0.5", rang > 0 && "border-t border-bordure pt-1")}>
              {section.titre && (
                <p className="px-3 pb-1 pt-2 text-sm font-semibold uppercase tracking-wider text-texte-secondaire">{section.titre}</p>
              )}
              <ul className="flex flex-col gap-0.5">
                {section.liens.map((lien) => {
                  const estActif = estLienActif(lien.href, chemin);
                  const IconeLien = lien.icone;
                  return (
                    <li key={lien.href}>
                      <Link
                        href={lien.href}
                        onClick={fermer}
                        aria-current={estActif ? "page" : undefined}
                        className={cn(LIEN_SOUS_MENU, estActif && "bg-ciel font-semibold text-marine")}
                      >
                        <IconeLien className={cn("size-4 shrink-0", estActif ? "text-primaire" : "text-texte-secondaire")} aria-hidden="true" />
                        <span className="flex-1">{lien.libelle}</span>
                        {estActif && <span className="size-1.5 rounded-full bg-primaire" aria-hidden="true" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Barre de navigation (ordinateur) et tiroir (mobile), limités aux pages accordées au compte. */
export function BarreNavigation({ droits }: { droits: Droits }) {
  const chemin = usePathname();
  const menus = menusVisibles(droits);

  return (
    <>
      <nav aria-label={TEXTES_NAVIGATION.menuPrincipal} className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {menus.map((menu) => {
            if (!menu.href) {
              return (
                <li key={menu.libelle}>
                  <MenuDeroulant menu={menu} chemin={chemin} />
                </li>
              );
            }
            const estActif = chemin === menu.href;
            const Icone = menu.icone;
            return (
              <li key={menu.libelle}>
                <Link href={menu.href} aria-current={estActif ? "page" : undefined} className={cn(ENTREE, estActif && ENTREE_ACTIVE)}>
                  <Icone className="size-4 shrink-0" aria-hidden="true" />
                  {menu.libelle}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <TiroirNavigation menus={menus} chemin={chemin} />
    </>
  );
}
