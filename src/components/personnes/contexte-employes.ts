"use client";

import { createContext, use } from "react";

/** Employé visé par une action de la liste (le nom sert aux titres et confirmations). */
export type EmployeVise = { id: string; nomComplet: string };

export type ActionsEmployes = {
  voir: (employe: EmployeVise) => void;
  modifier: (employe: EmployeVise) => void;
  supprimer: (employe: EmployeVise) => void;
};

export const ContexteEmployes = createContext<ActionsEmployes | null>(null);

export function useActionsEmployes(): ActionsEmployes {
  const actions = use(ContexteEmployes);
  if (!actions) throw new Error("useActionsEmployes doit être utilisé dans GestionEmployes.");
  return actions;
}
