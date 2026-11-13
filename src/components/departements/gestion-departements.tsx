"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { MessageSucces } from "@/components/ui/message-succes";
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
import { FormulaireDepartement } from "./formulaire-departement";
import { SuppressionDepartement } from "./suppression-departement";

const { arbre: textesArbre, formulaire: textes } = TEXTES_DEPARTEMENTS;
type Succes = NonNullable<EtatFormulaireDepartement["succes"]>;

const BOUTON_ICONE =
  "flex size-11 items-center justify-center rounded-lg text-texte-secondaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire";

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

  const nombreEnfants = selection ? departements.filter((d) => d.parentId === selection.id).length : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(18rem,2fr)_3fr]">
      <section className="rounded-xl border border-bordure bg-surface p-4" aria-labelledby="titre-arbre">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="titre-arbre" className="text-lg font-semibold text-marine">
            {textesArbre.titre}
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" className={BOUTON_ICONE} aria-label={textesArbre.toutDeplier} title={textesArbre.toutDeplier} onClick={() => setIdsOuverts(new Set(idsParents))}>
              <ChevronsUpDown className="size-5" aria-hidden="true" />
            </button>
            <button type="button" className={BOUTON_ICONE} aria-label={textesArbre.toutReplier} title={textesArbre.toutReplier} onClick={() => setIdsOuverts(new Set())}>
              <ChevronsDownUp className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <Bouton variante="contour" className="mb-3 w-full" onClick={() => selectionner(null)}>
          <Plus className="size-5" aria-hidden="true" />
          {textesArbre.nouveau}
        </Bouton>
        <ArbreDepartements
          noeuds={arbre}
          idSelectionne={idSelectionne}
          idsOuverts={idsOuverts}
          onBasculer={basculer}
          onSelectionner={selectionner}
        />
      </section>

      <section className="flex flex-col gap-5 rounded-xl border border-bordure bg-surface p-6" aria-labelledby="titre-formulaire">
        <div>
          <h2 id="titre-formulaire" className="text-lg font-semibold text-marine">
            {selection ? textes.titreModification : textes.titreCreation}
          </h2>
          {selection && (
            <p className="mt-1 text-sm text-texte-secondaire">
              {textesArbre.sousDepartements(nombreEnfants)}
            </p>
          )}
        </div>
        <MessageSucces message={messageSucces} />
        <FormulaireDepartement
          // Recréé quand le département change en base : les valeurs par défaut suivent.
          key={selection ? `formulaire-${selection.id}-${selection.parentId}-${selection.nom}` : "formulaire-nouveau"}
          departement={selection}
          parentParDefaut={null}
          optionsParent={optionsParent}
          onTermine={terminer}
        />
        {selection && (
          <SuppressionDepartement key={`suppression-${selection.id}`} id={selection.id} nom={selection.nom} onTermine={terminer} />
        )}
      </section>
    </div>
  );
}
