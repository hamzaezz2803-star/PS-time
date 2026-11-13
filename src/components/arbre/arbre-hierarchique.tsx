"use client";

import { ChevronRight, FileText, Folder, FolderOpen, FolderPlus } from "lucide-react";
import type { NoeudDepartement } from "@/lib/metier/arbre-departements";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import { cn } from "@/lib/utils";

const { arbre: textes } = TEXTES_DEPARTEMENTS;

type ProprietesArbre = {
  noeuds: NoeudDepartement[];
  idSelectionne: string | null;
  idsOuverts: Set<string>;
  onBasculer: (id: string) => void;
  onSelectionner: (id: string) => void;
};

function Noeud({ noeud, ...proprietes }: Omit<ProprietesArbre, "noeuds"> & { noeud: NoeudDepartement }) {
  const aDesEnfants = noeud.enfants.length > 0;
  const estOuvert = proprietes.idsOuverts.has(noeud.id);
  const estSelectionne = proprietes.idSelectionne === noeud.id;
  const Icone = !aDesEnfants ? FileText : estOuvert ? FolderOpen : Folder;

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
          <Icone
            className={cn("size-4 shrink-0", estSelectionne ? "text-primaire" : "text-texte-secondaire")}
            aria-hidden="true"
          />
          <span className="truncate">{noeud.nom}</span>
        </button>
      </div>
      {aDesEnfants && estOuvert && (
        // La ligne verticale montre le rattachement des sous-départements à leur parent.
        <ul className="ms-[1.375rem] border-s border-bordure ps-1.5 lg:ms-4">
          {noeud.enfants.map((enfant) => (
            <Noeud key={enfant.id} noeud={enfant} {...proprietes} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Arbre des départements : chevron pour déplier, clic sur le nom pour sélectionner. */
export function ArbreDepartements({ noeuds, ...proprietes }: ProprietesArbre) {
  if (noeuds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire">
          <FolderPlus className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-base font-semibold text-texte">{textes.vide}</p>
          <p className="mt-1 text-sm text-texte-secondaire">{textes.videAction}</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {noeuds.map((noeud) => (
        <Noeud key={noeud.id} noeud={noeud} {...proprietes} />
      ))}
    </ul>
  );
}
