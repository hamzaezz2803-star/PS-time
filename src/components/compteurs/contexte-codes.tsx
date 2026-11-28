"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { codesDesEvenements, type CodesCompteurs } from "@/lib/metier/compteurs/variables-evenements";
import type { CodeEvenementCompteur } from "@/types";

type ValeurContexte = { liste: readonly CodeEvenementCompteur[]; codes: CodesCompteurs };

const ContexteCodes = createContext<ValeurContexte>({ liste: [], codes: { evenements: [], droits: [] } });

/** Événements de l'installation, partagés par la page des compteurs (vérification, aide, essai, état). */
export function FournisseurCodesEvenements({ liste, children }: { liste: readonly CodeEvenementCompteur[]; children: ReactNode }) {
  const valeur = useMemo(() => ({ liste, codes: codesDesEvenements(liste) }), [liste]);
  return <ContexteCodes.Provider value={valeur}>{children}</ContexteCodes.Provider>;
}

/** Événements qui donnent des variables aux formules (JOURS_, MIN_, PRIS_, SOLDE_). */
export const useCodesEvenements = () => useContext(ContexteCodes);
