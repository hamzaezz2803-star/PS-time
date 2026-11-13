"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import {
  aplatirArbre,
  construireArbre,
  idsAncetres,
  idsDescendants,
  type DepartementPlat,
} from "@/lib/metier/arbre-departements";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import type { EtatFormulaireDepartement } from "@/types";
import { ArbreDepartements } from "./arbre-departements";
import { PanneauDepartement } from "./panneau-departement";

const { arbre: textesArbre } = TEXTES_DEPARTEMENTS;
type Succes = NonNullable<EtatFormulaireDepartement["succes"]>;

const BOUTON_ICONE =
  "flex size-11 shrink-0 items-center justify-center rounded-md text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:size-8";

/** Vue complète : arbre à gauche, formulaire de création ou de modification à droite. */
export function GestionDepartements({ departements }: { departements: DepartementPlat[] }) {
  const arbre = useMemo(() => construireArbre(departements), [departements]);
  const idsParents = useMemo(
    () => new Set(departements.flatMap((d) => (d.parentId ? [d.parentId] : []))),
    [departements],
  );

  const [idSelectionne, setIdSelectionne] = useState<string | null>(null);
  const [idsOuverts, setIdsOuverts] = useState<Set<string>>(() => idsParents);
  const [messageSucces, setMessageSucces] = useState<string>();
  // Département à rendre visible une fois la liste rafraîchie arrivée (pas l'ancienne liste,
  // où un département déplacé a encore son ancien parent).
  const [aRendreVisible, setARendreVisible] = useState<{
    id: string;
    listeAvant: DepartementPlat[];
  } | null>(null);

  if (aRendreVisible && departements !== aRendreVisible.listeAvant) {
    const ancetres = idsAncetres(departements, aRendreVisible.id);
    setARendreVisible(null);
    setIdsOuverts((ouverts) => new Set([...ouverts, ...ancetres]));
  }

  const selection = departements.find((d) => d.id === idSelectionne);

  // Un département ne peut pas devenir l'enfant de lui-même ni d'un de ses descendants.
  const optionsParent = useMemo(() => {
    const exclus = selection ? idsDescendants(departements, selection.id).add(selection.id) : new Set();
    return aplatirArbre(arbre).filter((option) => !exclus.has(option.id));
  }, [arbre, departements, selection]);

  const selectionner = (id: string | null) => {
    setIdSelectionne(id);
    setMessageSucces(undefined);
  };

  const basculer = (id: string) =>
    setIdsOuverts((ouverts) => {
      const copie = new Set(ouverts);
      if (!copie.delete(id)) copie.add(id);
      return copie;
    });

  const terminer = useCallback(
    (succes: Succes) => {
      setMessageSucces(succes.message);
      setIdSelectionne(succes.idSelectionne);
      if (succes.idSelectionne) {
        setARendreVisible({ id: succes.idSelectionne, listeAvant: departements });
      }
    },
    [departements],
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(20rem,5fr)_7fr]">
      <section
        className="overflow-hidden rounded-xl border border-bordure bg-surface"
        aria-labelledby="titre-arbre"
      >
        <div className="flex items-center gap-1 border-b border-bordure py-3 pe-2 ps-4">
          <div className="min-w-0 flex-1">
            <h2 id="titre-arbre" className="text-base font-semibold text-marine">
              {textesArbre.titre}
            </h2>
            <p className="text-sm text-texte-secondaire">{textesArbre.total(departements.length)}</p>
          </div>
          <button
            type="button"
            className={BOUTON_ICONE}
            aria-label={textesArbre.toutDeplier}
            title={textesArbre.toutDeplier}
            onClick={() => setIdsOuverts(new Set(idsParents))}
          >
            <ChevronsUpDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={BOUTON_ICONE}
            aria-label={textesArbre.toutReplier}
            title={textesArbre.toutReplier}
            onClick={() => setIdsOuverts(new Set())}
          >
            <ChevronsDownUp className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-2">
          <ArbreDepartements
            noeuds={arbre}
            idSelectionne={idSelectionne}
            idsOuverts={idsOuverts}
            onBasculer={basculer}
            onSelectionner={selectionner}
          />
        </div>
        <div className="border-t border-bordure p-2">
          <Bouton
            variante="fantome"
            className="w-full justify-start px-3"
            onClick={() => selectionner(null)}
            aria-pressed={!selection}
          >
            <Plus className="size-4" aria-hidden="true" />
            {textesArbre.nouveau}
          </Bouton>
        </div>
      </section>

      <PanneauDepartement
        selection={selection}
        departements={departements}
        optionsParent={optionsParent}
        messageSucces={messageSucces}
        onTermine={terminer}
      />
    </div>
  );
}
