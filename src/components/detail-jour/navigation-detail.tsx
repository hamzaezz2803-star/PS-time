"use client";

import { createContext, use, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CHEMIN_DETAIL_JOUR } from "@/lib/constantes";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import { cn } from "@/lib/utils";

/** Sélection affichée : tout l'état de l'écran est dans l'URL (?employe=…&date=…&jours=…). */
export type SelectionDetail = { employe: string | null; date: string; jours: number };

type ContexteNavigation = { selection: SelectionDetail; naviguer: (changements: Partial<SelectionDetail>) => void; enCours: boolean };

const Contexte = createContext<ContexteNavigation | null>(null);

export function useNavigationDetail(): ContexteNavigation {
  const contexte = use(Contexte);
  if (!contexte) throw new Error("useNavigationDetail hors de NavigationDetail");
  return contexte;
}

/**
 * Change la sélection en changeant l'URL. Pendant le chargement, l'ancien détail reste affiché
 * (atténué) : il est remplacé d'un coup par la réponse de la dernière demande seulement.
 */
export function NavigationDetail({ selection, children }: { selection: SelectionDetail; children: ReactNode }) {
  const routeur = useRouter();
  const [enCours, demarrer] = useTransition();

  const naviguer = (changements: Partial<SelectionDetail>) => {
    const suivante = { ...selection, ...changements };
    const parametres = new URLSearchParams({ date: suivante.date, jours: String(suivante.jours) });
    if (suivante.employe) parametres.set("employe", suivante.employe);
    demarrer(() => routeur.push(`${CHEMIN_DETAIL_JOUR}?${parametres.toString()}`, { scroll: false }));
  };

  return <Contexte value={{ selection, naviguer, enCours }}>{children}</Contexte>;
}

/** Contenu atténué et signalé « occupé » pendant un changement de sélection. */
export function ZoneDetail({ children }: { children: ReactNode }) {
  const { enCours } = useNavigationDetail();
  return (
    <div aria-busy={enCours} className={cn("flex flex-col gap-6 transition-opacity duration-150 motion-reduce:transition-none", enCours && "pointer-events-none opacity-55")}>
      <p role="status" aria-live="polite" className="sr-only">{enCours ? TEXTES_DETAIL_JOUR.miseAJour : ""}</p>
      {children}
    </div>
  );
}
