"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, KeyRound, LogOut } from "lucide-react";
import { deconnecter } from "@/lib/actions/deconnexion";
import { CHEMIN_CHANGER_MOT_DE_PASSE } from "@/lib/constantes";
import { initiales } from "@/lib/formats";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";
import { useMenu } from "./contexte-menu";

const { compte } = TEXTES_NAVIGATION;
const ENTREE =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-texte transition-colors duration-150 hover:bg-canevas focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9";

/** Compte connecté en pied de menu : nom, e-mail, mot de passe et déconnexion. */
export function MenuUtilisateur({ nom, email }: { nom: string; email: string }) {
  const { estReplie } = useMenu();
  const [estOuvert, setEstOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!estOuvert) return;
    const fermerSiDehors = (evenement: PointerEvent) => {
      if (!conteneur.current?.contains(evenement.target as Node)) setEstOuvert(false);
    };
    const fermerSurEchap = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setEstOuvert(false);
    };
    document.addEventListener("pointerdown", fermerSiDehors);
    document.addEventListener("keydown", fermerSurEchap);
    return () => {
      document.removeEventListener("pointerdown", fermerSiDehors);
      document.removeEventListener("keydown", fermerSurEchap);
    };
  }, [estOuvert]);

  return (
    <div ref={conteneur} className="relative">
      {estOuvert && (
        <div
          id="menu-compte"
          className={cn(
            "absolute bottom-full z-50 mb-2 w-60 animate-apparition rounded-lg bg-surface p-1 shadow-flottant ring-1 ring-bordure motion-reduce:animate-none",
            estReplie ? "lg:start-0" : "start-0 end-0 w-auto",
          )}
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-texte">{nom}</p>
            <p className="truncate text-sm text-texte-secondaire">{email}</p>
          </div>
          <div className="my-1 h-px bg-bordure" />
          <Link href={CHEMIN_CHANGER_MOT_DE_PASSE} className={ENTREE}>
            <KeyRound className="size-4 text-texte-secondaire" aria-hidden="true" />
            {compte.changerMotDePasse}
          </Link>
          <form action={deconnecter}>
            <button type="submit" className={ENTREE}>
              <LogOut className="size-4 text-texte-secondaire" aria-hidden="true" />
              {compte.deconnexion}
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setEstOuvert((ouvert) => !ouvert)}
        aria-expanded={estOuvert}
        aria-controls="menu-compte"
        aria-label={compte.ouvrir}
        className="flex min-h-12 w-full items-center gap-2.5 rounded-lg p-1.5 text-start transition-colors duration-150 hover:bg-menu-survol hover:shadow-carte focus-visible:outline-2 focus-visible:outline-primaire"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-marine text-sm font-semibold text-white">
          {initiales(nom)}
        </span>
        <span className={cn("min-w-0 flex-1", estReplie && "lg:sr-only")}>
          <span className="block truncate text-sm font-semibold text-menu-texte">{nom}</span>
          <span className="block truncate text-sm text-menu-texte-secondaire">{email}</span>
        </span>
        <ChevronsUpDown
          className={cn("size-4 shrink-0 text-menu-texte-secondaire", estReplie && "lg:hidden")}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
