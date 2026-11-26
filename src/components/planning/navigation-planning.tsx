"use client";

import { createContext, use, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CHEMIN_PLANNING_VUE } from "@/lib/constantes";
import { TEXTES_PLANNING } from "@/lib/textes/planning";
import { cn } from "@/lib/utils";
import type { SelectionPlanning } from "@/lib/validation/planning-consultation";

type ContexteNavigation = { selection: SelectionPlanning; naviguer: (changements: Partial<SelectionPlanning>) => void; enCours: boolean };

const Contexte = createContext<ContexteNavigation | null>(null);

export function useNavigationPlanning(): ContexteNavigation {
  const contexte = use(Contexte);
  if (!contexte) throw new Error("useNavigationPlanning hors de NavigationPlanning");
  return contexte;
}

/** Change la sélection (employé, vue, mois, année) en changeant l'URL ; l'ancien planning reste affiché pendant le chargement. */
export function NavigationPlanning({ selection, children }: { selection: SelectionPlanning; children: ReactNode }) {
  const routeur = useRouter();
  const [enCours, demarrer] = useTransition();

  const naviguer = (changements: Partial<SelectionPlanning>) => {
    const suivante = { ...selection, ...changements };
    const parametres = new URLSearchParams({ mois: suivante.mois, annee: String(suivante.annee) });
    if (suivante.employe) parametres.set("employe", suivante.employe);
    demarrer(() => routeur.push(`${CHEMIN_PLANNING_VUE(suivante.vue)}?${parametres.toString()}`, { scroll: false }));
  };

  return <Contexte value={{ selection, naviguer, enCours }}>{children}</Contexte>;
}

/** Contenu atténué et signalé « occupé » pendant un changement de sélection. */
export function ZonePlanning({ children }: { children: ReactNode }) {
  const { enCours } = useNavigationPlanning();
  return (
    <div aria-busy={enCours} className={cn("flex flex-col gap-6 transition-opacity duration-150 motion-reduce:transition-none", enCours && "pointer-events-none opacity-55")}>
      <p role="status" aria-live="polite" className="sr-only">{enCours ? TEXTES_PLANNING.miseAJour : ""}</p>
      {children}
    </div>
  );
}
