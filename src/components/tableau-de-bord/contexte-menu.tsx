"use client";

import { createContext, use } from "react";

export type EtatMenu = {
  /** Ordinateur : menu réduit aux icônes. */
  estReplie: boolean;
  /** Mobile : tiroir ouvert. */
  estOuvertMobile: boolean;
  basculer: () => void;
  fermerMobile: () => void;
};

export const ContexteMenu = createContext<EtatMenu | null>(null);

export function useMenu(): EtatMenu {
  const etat = use(ContexteMenu);
  if (!etat) throw new Error("useMenu doit être utilisé dans CadreTableauDeBord.");
  return etat;
}
