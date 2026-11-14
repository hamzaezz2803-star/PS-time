"use client";

import type { ReactNode } from "react";
import { ChevronRight, UserRound, type LucideIcon } from "lucide-react";
import type { ElementArbre, Noeud } from "@/lib/metier/arbre";
import { cn } from "@/lib/utils";

export type TextesArbre = {
  deplier: (nom: string) => string;
  replier: (nom: string) => string;
  vide: string;
  videAction: string;
  /** Nom accessible de l'indicateur d'employés (ex. « 3 employés »). */
  employes: (nombre: number) => string;
};

/** Icônes propres à chaque écran : parent (qui a des enfants) et enfant (sans enfant). */
export type IconesArbre = { parent: LucideIcon; enfant: LucideIcon };

type ProprietesArbre<T extends ElementArbre> = {
  noeuds: Noeud<T>[];
  idSelectionne: string | null;
  idsOuverts: Set<string>;
  onBasculer: (id: string) => void;
  onSelectionner: (id: string) => void;
  textes: TextesArbre;
  icones: IconesArbre;
  /** Nombre d'employés rattachés à l'élément, affiché en indicateur. */
  nombreEmployes?: (element: T) => number;
  /** Information secondaire affichée après le nom (ex. le numéro d'un poste). */
  detail?: (element: T) => ReactNode;
  /** Boutons affichés au bout de chaque ligne (ex. modifier, supprimer). */
  actions?: (element: T) => ReactNode;
};

function Ligne<T extends ElementArbre>({
  noeud,
  ...proprietes
}: Omit<ProprietesArbre<T>, "noeuds"> & { noeud: Noeud<T> }) {
  const { textes } = proprietes;
  const aDesEnfants = noeud.enfants.length > 0;
  const estOuvert = proprietes.idsOuverts.has(noeud.id);
  const estSelectionne = proprietes.idSelectionne === noeud.id;
  const Icone = aDesEnfants ? proprietes.icones.parent : proprietes.icones.enfant;
  const nombreEmployes = proprietes.nombreEmployes?.(noeud);

  return (
    <li>
      <div className="flex items-center gap-0.5">
        {aDesEnfants ? (
          <button
            type="button"
            onClick={() => proprietes.onBasculer(noeud.id)}
            aria-expanded={estOuvert}
            aria-label={estOuvert ? textes.replier(noeud.nom) : textes.deplier(noeud.nom)}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:size-8"
          >
            <ChevronRight
              className={cn("size-4 transition-transform duration-150 motion-reduce:transition-none", estOuvert && "rotate-90")}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="size-11 shrink-0 lg:size-8" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={() => proprietes.onSelectionner(noeud.id)}
          aria-current={estSelectionne ? "true" : undefined}
          className={cn(
            "flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 text-start text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9",
            estSelectionne ? "bg-ciel font-semibold text-primaire" : "text-texte hover:bg-canevas",
          )}
        >
          {/* Un parent se distingue par une pastille colorée ; un enfant par une icône seule. */}
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md",
              aDesEnfants ? "bg-ciel text-primaire" : estSelectionne ? "text-primaire" : "text-texte-secondaire",
            )}
            aria-hidden="true"
          >
            <Icone className="size-4" />
          </span>
          <span className={cn("truncate", aDesEnfants && "font-semibold")}>{noeud.nom}</span>
          {nombreEmployes !== undefined && (
            <span
              title={proprietes.textes.employes(nombreEmployes)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 text-sm font-normal tabular-nums",
                nombreEmployes > 0 ? "bg-canevas text-texte" : "text-texte-secondaire",
              )}
            >
              <UserRound className="size-3.5" aria-hidden="true" />
              <span aria-hidden="true">{nombreEmployes}</span>
              <span className="sr-only">{proprietes.textes.employes(nombreEmployes)}</span>
            </span>
          )}
          {proprietes.detail && (
            <span className="ms-auto shrink-0 text-sm font-normal tabular-nums text-texte-secondaire">
              {proprietes.detail(noeud)}
            </span>
          )}
        </button>
        {proprietes.actions?.(noeud)}
      </div>
      {aDesEnfants && estOuvert && (
        // La ligne verticale montre le rattachement des enfants à leur parent.
        <ul className="ms-[1.375rem] border-s border-bordure ps-1.5 lg:ms-4">
          {noeud.enfants.map((enfant) => (
            <Ligne key={enfant.id} noeud={enfant} {...proprietes} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Arbre parent/enfants : chevron pour déplier, clic sur le nom pour sélectionner. */
export function ArbreHierarchique<T extends ElementArbre>({ noeuds, ...proprietes }: ProprietesArbre<T>) {
  if (noeuds.length === 0) {
    const IconeVide = proprietes.icones.parent;
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire">
          <IconeVide className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-base font-semibold text-texte">{proprietes.textes.vide}</p>
          <p className="mt-1 text-sm text-texte-secondaire">{proprietes.textes.videAction}</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {noeuds.map((noeud) => (
        <Ligne key={noeud.id} noeud={noeud} {...proprietes} />
      ))}
    </ul>
  );
}
