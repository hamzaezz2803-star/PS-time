"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { estLienActif, type LienNavigation, type SectionNavigation } from "./navigation";

function LienPanneau({ lien, chemin, onChoisir }: { lien: LienNavigation; chemin: string; onChoisir: () => void }) {
  const estActif = estLienActif(lien.href, chemin);
  const Icone = lien.icone;
  return (
    <Link
      href={lien.href}
      onClick={onChoisir}
      aria-current={estActif ? "page" : undefined}
      className={cn(
        "group flex items-start gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-canevas focus-visible:outline-2 focus-visible:outline-primaire",
        estActif && "bg-ciel",
      )}
    >
      <span
        data-icone-menu=""
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors duration-150",
          estActif
            ? "border-primaire bg-primaire text-white"
            : "border-bordure bg-surface text-texte-secondaire group-hover:border-primaire group-hover:text-primaire",
        )}
      >
        <Icone className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 leading-5">
        <span className={cn("flex items-center gap-2 text-sm font-medium text-texte", estActif && "font-semibold text-marine")}>
          {lien.libelle}
          {estActif && <span className="size-1.5 rounded-full bg-primaire" aria-hidden="true" />}
        </span>
        <span className="block text-sm text-texte-secondaire group-hover:text-texte">{lien.description}</span>
      </span>
    </Link>
  );
}

/** Panneau d'un menu déroulant : une colonne par section, chaque page avec son icône et sa description. */
export function PanneauMenu({
  id,
  sections,
  chemin,
  alignerAFin,
  onChoisir,
}: {
  id: string;
  sections: SectionNavigation[];
  chemin: string;
  alignerAFin: boolean;
  onChoisir: () => void;
}) {
  return (
    // Marge intérieure (et non extérieure) : la souris passe du bouton au panneau sans le fermer.
    <div id={id} className={cn("absolute top-full z-40 pt-3", alignerAFin ? "end-0" : "start-0")}>
      <div className="flex w-max max-w-[calc(100vw-2rem)] animate-apparition gap-6 rounded-xl bg-surface p-4 shadow-flottant ring-1 ring-bordure motion-reduce:animate-none">
        {sections.map((section, rang) => (
          <div key={section.titre ?? rang} className="flex w-64 flex-col">
            {section.titre && <p className="mb-2 px-2 text-sm font-medium text-texte-secondaire">{section.titre}</p>}
            <ul className="flex flex-col gap-1">
              {section.liens.map((lien) => (
                <li key={lien.href}>
                  <LienPanneau lien={lien} chemin={chemin} onChoisir={onChoisir} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
