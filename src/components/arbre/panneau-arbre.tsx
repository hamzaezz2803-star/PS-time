"use client";

import type { ReactNode } from "react";
import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { BoutonIcone } from "@/components/ui/bouton-icone";

/** Liste en arbre sur toute la largeur : titre, total, déplier/replier et bouton « Nouveau ». */
export function PanneauArbre({
  titre,
  total,
  textes,
  onToutDeplier,
  onToutReplier,
  onNouveau,
  children,
}: {
  titre: string;
  total: string;
  textes: { toutDeplier: string; toutReplier: string; nouveau: string };
  onToutDeplier: () => void;
  onToutReplier: () => void;
  onNouveau: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-bordure bg-surface" aria-labelledby="titre-arbre">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-bordure px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 id="titre-arbre" className="text-base font-semibold text-marine">{titre}</h2>
          <p className="text-sm text-texte-secondaire">{total}</p>
        </div>
        <BoutonIcone libelle={textes.toutDeplier} Icone={ChevronsUpDown} onClick={onToutDeplier} />
        <BoutonIcone libelle={textes.toutReplier} Icone={ChevronsDownUp} onClick={onToutReplier} />
        <Bouton onClick={onNouveau} className="w-full sm:ms-2 sm:w-fit">
          <Plus className="size-5" aria-hidden="true" />
          {textes.nouveau}
        </Bouton>
      </div>
      <div className="p-2 sm:p-3">{children}</div>
    </section>
  );
}
