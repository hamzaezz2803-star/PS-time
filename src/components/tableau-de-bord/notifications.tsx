"use client";

import { Bell, BellOff } from "lucide-react";
import { useMenuDeroulant } from "@/components/ui/utiliser-menu-deroulant";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";

const textes = TEXTES_NAVIGATION.notifications;

/**
 * Cloche de la barre du haut. Aucune alerte n'existe encore (le pointage n'est pas
 * développé) : le panneau l'indique, sans pastille ni chiffre inventés.
 */
export function Notifications() {
  const { estOuvert, basculer, conteneur } = useMenuDeroulant();

  return (
    <div ref={conteneur} className="relative">
      <button
        type="button"
        onClick={basculer}
        aria-expanded={estOuvert}
        aria-controls="panneau-notifications"
        aria-label={textes.ouvrir}
        title={textes.ouvrir}
        className={cn(
          "flex size-11 items-center justify-center rounded-lg text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:size-9",
          estOuvert && "bg-canevas text-texte",
        )}
      >
        <Bell className="size-[18px]" aria-hidden="true" />
      </button>
      {estOuvert && (
        <div
          id="panneau-notifications"
          className="absolute end-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-1rem)] animate-apparition rounded-xl bg-surface shadow-flottant ring-1 ring-bordure motion-reduce:animate-none"
        >
          <p className="border-b border-bordure px-4 py-3 text-sm font-semibold text-marine">{textes.titre}</p>
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-canevas text-texte-secondaire">
              <BellOff className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-texte">{textes.vide}</p>
            <p className="text-sm text-texte-secondaire">{textes.aide}</p>
          </div>
        </div>
      )}
    </div>
  );
}
