"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";
import { useMenu } from "./contexte-menu";
import { estLienActif, type LienNavigation, type MenuNavigation } from "./navigation";

const LIGNE =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-base text-texte transition-colors duration-150 hover:bg-canevas focus-visible:outline-2 focus-visible:outline-primaire";

function LienTiroir({ lien, estActif }: { lien: Pick<LienNavigation, "libelle" | "icone" | "href">; estActif: boolean }) {
  const { fermerMobile } = useMenu();
  const Icone = lien.icone;
  return (
    <Link href={lien.href} onClick={fermerMobile} aria-current={estActif ? "page" : undefined} className={cn(LIGNE, estActif && "bg-ciel font-semibold text-marine")}>
      <Icone className={cn("size-[18px] shrink-0", estActif ? "text-primaire" : "text-texte-secondaire")} aria-hidden="true" />
      {lien.libelle}
    </Link>
  );
}

/** Tiroir de navigation sur mobile et tablette : tous les menus dépliés, fermé par Échap ou un clic à côté. */
export function TiroirNavigation({ menus, chemin }: { menus: MenuNavigation[]; chemin: string }) {
  const { estOuvertMobile, fermerMobile } = useMenu();

  useEffect(() => {
    if (!estOuvertMobile) return;
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") fermerMobile();
    };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [estOuvertMobile, fermerMobile]);

  if (!estOuvertMobile) return null;

  return (
    <div className=cn("fixed inset-0 z-40", TIROIR_VISIBLE) role="dialog" aria-modal="true" aria-label={TEXTES_NAVIGATION.menuPrincipal}>
      <div className="absolute inset-0 bg-marine/50" onClick={fermerMobile} aria-hidden="true" />
      <nav
        aria-label={TEXTES_NAVIGATION.menuPrincipal}
        className="relative flex h-full w-80 max-w-[88vw] animate-apparition flex-col overflow-y-auto bg-surface p-3 shadow-flottant motion-reduce:animate-none"
      >
        <div className="mb-2 flex items-center justify-between ps-3">
          <span className="text-base font-bold text-marine">{TEXTES_NAVIGATION.nomApplication}</span>
          <button
            type="button"
            onClick={fermerMobile}
            aria-label={TEXTES_NAVIGATION.fermerMenu}
            autoFocus
            className="flex size-11 items-center justify-center rounded-lg text-texte-secondaire hover:bg-canevas focus-visible:outline-2 focus-visible:outline-primaire"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-4">
          {menus.map((menu) => (
            <li key={menu.libelle} className="flex flex-col gap-0.5">
              {menu.href ? (
                <LienTiroir lien={{ libelle: menu.libelle, icone: menu.icone, href: menu.href }} estActif={chemin === menu.href} />
              ) : (
                <>
                  <p className="px-3 pb-1 text-sm font-semibold uppercase tracking-wider text-texte-secondaire">{menu.libelle}</p>
                  {menu.sections?.map((section, rang) => (
                    <div key={section.titre ?? rang} className="flex flex-col gap-0.5">
                      {section.titre && <p className="px-3 pt-1 text-sm font-medium text-texte-secondaire">{section.titre}</p>}
                      {section.liens.map((lien) => (
                        <LienTiroir key={lien.href} lien={lien} estActif={estLienActif(lien.href, chemin)} />
                      ))}
                    </div>
                  ))}
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
