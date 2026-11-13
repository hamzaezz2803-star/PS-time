"use client";

import type { ReactNode } from "react";
import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";

const BOUTON_ICONE =
  "flex size-11 shrink-0 items-center justify-center rounded-md text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:size-8";

/** Panneau de gauche : titre, total, déplier/replier, l'arbre, puis « Nouveau ». */
export function PanneauArbre({
  titre,
  total,
  textes,
  estEnCreation,
  onToutDeplier,
  onToutReplier,
  onNouveau,
  children,
}: {
  titre: string;
  total: string;
  textes: { toutDeplier: string; toutReplier: string; nouveau: string };
  estEnCreation: boolean;
  onToutDeplier: () => void;
  onToutReplier: () => void;
  onNouveau: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-bordure bg-surface" aria-labelledby="titre-arbre">
      <div className="flex items-center gap-1 border-b border-bordure py-3 pe-2 ps-4">
        <div className="min-w-0 flex-1">
          <h2 id="titre-arbre" className="text-base font-semibold text-marine">{titre}</h2>
          <p className="text-sm text-texte-secondaire">{total}</p>
        </div>
        <button type="button" className={BOUTON_ICONE} aria-label={textes.toutDeplier} title={textes.toutDeplier} onClick={onToutDeplier}>
          <ChevronsUpDown className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className={BOUTON_ICONE} aria-label={textes.toutReplier} title={textes.toutReplier} onClick={onToutReplier}>
          <ChevronsDownUp className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="p-2">{children}</div>
      <div className="border-t border-bordure p-2">
        <Bouton variante="fantome" className="w-full justify-start px-3" onClick={onNouveau} aria-pressed={estEnCreation}>
          <Plus className="size-4" aria-hidden="true" />
          {textes.nouveau}
        </Bouton>
      </div>
    </section>
  );
}
