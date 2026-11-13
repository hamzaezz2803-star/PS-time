"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import {
  SECTIONS_NAVIGATION,
  type LienNavigation,
  type SectionNavigation,
} from "./navigation";

const STYLE_LIGNE =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function Lien({
  lien,
  estActif,
  estSousLien = false,
  onNavigation,
}: {
  lien: LienNavigation;
  estActif: boolean;
  estSousLien?: boolean;
  onNavigation: () => void;
}) {
  const Icone = lien.icone;
  const contenu = (
    <>
      <Icone className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-start">{lien.libelle}</span>
    </>
  );

  if (!lien.href) {
    return (
      <span className={cn(STYLE_LIGNE, estSousLien && "ps-10", "cursor-default text-white/60")}>
        {contenu}
        <span className="rounded-md border border-white/30 px-2 py-0.5 text-sm">
          {TEXTES_NAVIGATION.bientot}
        </span>
      </span>
    );
  }

  return (
    <Link
      href={lien.href}
      onClick={onNavigation}
      aria-current={estActif ? "page" : undefined}
      className={cn(
        STYLE_LIGNE,
        estSousLien && "ps-10",
        estActif
          ? "bg-white font-semibold text-marine"
          : "text-white/90 hover:bg-white/10",
      )}
    >
      {contenu}
    </Link>
  );
}

function Section({
  section,
  chemin,
  onNavigation,
}: {
  section: SectionNavigation;
  chemin: string;
  onNavigation: () => void;
}) {
  const [estOuverte, setEstOuverte] = useState(true);
  const Icone = section.icone;

  if (!section.liens) {
    return (
      <Lien lien={section} estActif={chemin === section.href} onNavigation={onNavigation} />
    );
  }

  const idListe = `menu-${section.libelle}`;
  return (
    <div>
      <button
        type="button"
        onClick={() => setEstOuverte((ouverte) => !ouverte)}
        aria-expanded={estOuverte}
        aria-controls={idListe}
        className={cn(STYLE_LIGNE, "font-semibold text-white hover:bg-white/10")}
      >
        <Icone className="size-5 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-start">{section.libelle}</span>
        <ChevronDown
          className={cn("size-5 transition-transform duration-150", !estOuverte && "-rotate-90")}
          aria-hidden="true"
        />
      </button>
      {estOuverte && (
        <ul id={idListe} className="mt-1 flex flex-col gap-1">
          {section.liens.map((lien) => (
            <li key={lien.libelle}>
              <Lien
                lien={lien}
                estSousLien
                estActif={Boolean(lien.href && chemin.startsWith(lien.href))}
                onNavigation={onNavigation}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Liens du menu latéral, partagés par la version ordinateur et le menu mobile. */
export function MenuLateral({ onNavigation }: { onNavigation: () => void }) {
  const chemin = usePathname();
  return (
    <nav aria-label={TEXTES_NAVIGATION.menuPrincipal}>
      <ul className="flex flex-col gap-2">
        {SECTIONS_NAVIGATION.map((section) => (
          <li key={section.libelle}>
            <Section section={section} chemin={chemin} onNavigation={onNavigation} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
