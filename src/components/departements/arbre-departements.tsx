"use client";

import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import type { NoeudDepartement } from "@/lib/metier/arbre-departements";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import { cn } from "@/lib/utils";

const { arbre: textes } = TEXTES_DEPARTEMENTS;
const RETRAIT_PAR_NIVEAU_PX = 20;

type ProprietesArbre = {
  noeuds: NoeudDepartement[];
  idSelectionne: string | null;
  idsOuverts: Set<string>;
  onBasculer: (id: string) => void;
  onSelectionner: (id: string) => void;
};

function Noeud({
  noeud,
  profondeur,
  ...proprietes
}: Omit<ProprietesArbre, "noeuds"> & { noeud: NoeudDepartement; profondeur: number }) {
  const aDesEnfants = noeud.enfants.length > 0;
  const estOuvert = proprietes.idsOuverts.has(noeud.id);
  const estSelectionne = proprietes.idSelectionne === noeud.id;
  const Icone = !aDesEnfants ? FileText : estOuvert ? FolderOpen : Folder;

  return (
    <li>
      <div
        className="flex items-center gap-1"
        style={{ paddingInlineStart: profondeur * RETRAIT_PAR_NIVEAU_PX }}
      >
        {aDesEnfants ? (
          <button
            type="button"
            onClick={() => proprietes.onBasculer(noeud.id)}
            aria-expanded={estOuvert}
            aria-label={estOuvert ? textes.replier(noeud.nom) : textes.deplier(noeud.nom)}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-texte-secondaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire"
          >
            <ChevronRight
              className={cn("size-5 transition-transform duration-150", estOuvert && "rotate-90")}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="size-11 shrink-0" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={() => proprietes.onSelectionner(noeud.id)}
          aria-current={estSelectionne ? "true" : undefined}
          className={cn(
            "flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-start text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire",
            estSelectionne ? "bg-primaire font-semibold text-white" : "text-texte hover:bg-ciel",
          )}
        >
          <Icone className="size-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{noeud.nom}</span>
        </button>
      </div>
      {aDesEnfants && estOuvert && (
        <ul>
          {noeud.enfants.map((enfant) => (
            <Noeud key={enfant.id} noeud={enfant} profondeur={profondeur + 1} {...proprietes} />
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
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <Folder className="size-10 text-texte-secondaire" aria-hidden="true" />
        <p className="text-base font-medium text-texte">{textes.vide}</p>
        <p className="text-sm text-texte-secondaire">{textes.videAction}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {noeuds.map((noeud) => (
        <Noeud key={noeud.id} noeud={noeud} profondeur={0} {...proprietes} />
      ))}
    </ul>
  );
}
