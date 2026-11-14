"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Fenêtre modale sur l'élément natif <dialog> : le navigateur gère le focus piégé,
 * la touche Échap et le fond assombri, sans bibliothèque.
 */
export function FenetreModale({
  ouverte,
  onFermer,
  titre,
  libelleFermer,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  libelleFermer: string;
  children: ReactNode;
}) {
  const fenetre = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = fenetre.current;
    if (!element) return;
    if (ouverte && !element.open) {
      element.showModal();
      // Le navigateur placerait le focus sur la croix : on le met sur le premier champ à remplir.
      element.querySelector<HTMLElement>("form input:not([type=hidden]), form select")?.focus();
    }
    if (!ouverte && element.open) element.close();
  }, [ouverte]);

  return (
    <dialog
      ref={fenetre}
      onClose={onFermer}
      aria-labelledby="titre-fenetre"
      className="m-auto flex max-h-[min(92dvh,56rem)] w-[calc(100%-1rem)] max-w-4xl flex-col overflow-hidden rounded-xl bg-surface p-0 text-texte shadow-[0_24px_48px_rgb(15_27_51/0.18)] ring-1 ring-bordure backdrop:bg-marine/40 not-open:hidden sm:w-[calc(100%-2rem)]"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-bordure py-3 pe-3 ps-5 sm:ps-6">
        <h2 id="titre-fenetre" className="text-lg font-semibold text-marine">
          {titre}
        </h2>
        <button
          type="button"
          onClick={onFermer}
          aria-label={libelleFermer}
          className="flex size-11 items-center justify-center rounded-md text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:size-9"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      {ouverte && children}
    </dialog>
  );
}
