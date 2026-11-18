"use client";

import { createContext, use } from "react";

export type EtatMenu = {
  /** Mobile et tablette : tiroir de navigation ouvert. */
  estOuvertMobile: boolean;
  basculerMobile: () => void;
  fermerMobile: () => void;
};

export const ContexteMenu = createContext<EtatMenu | null>(null);

export function useMenu(): EtatMenu {
  const etat = use(ContexteMenu);
  if (!etat) throw new Error("useMenu doit être utilisé dans CadreTableauDeBord.");
  return etat;
}
