"use client";

import { useEffect, useRef, useState } from "react";

/** Menu déroulant : ouverture, et fermeture par un clic à l'extérieur ou la touche Échap. */
export function useMenuDeroulant() {
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

  return { estOuvert, basculer: () => setEstOuvert((ouvert) => !ouvert), fermer: () => setEstOuvert(false), conteneur };
}
