"use client";

import { useCallback, useMemo, useState } from "react";
import {
  aplatirArbre,
  comparerParNom,
  construireArbre,
  idsAncetres,
  idsDescendants,
  type Comparateur,
  type ElementArbre,
} from "@/lib/metier/arbre";
import type { EtatFormulaire } from "@/types";

type Succes = NonNullable<EtatFormulaire["succes"]>;

/**
 * État commun aux écrans en arbre : sélection, branches ouvertes, message de réussite,
 * et options de parent possibles (jamais l'élément lui-même ni un de ses descendants).
 */
export function useGestionArbre<T extends ElementArbre>(
  liste: T[],
  comparer: Comparateur<T> = comparerParNom,
) {
  const arbre = useMemo(() => construireArbre(liste, comparer), [liste, comparer]);
  const idsParents = useMemo(
    () => new Set(liste.flatMap((element) => (element.parentId ? [element.parentId] : []))),
    [liste],
  );

  const [idSelectionne, setIdSelectionne] = useState<string | null>(null);
  const [idsOuverts, setIdsOuverts] = useState<Set<string>>(() => idsParents);
  const [messageSucces, setMessageSucces] = useState<string>();
  // Élément à rendre visible quand la liste rafraîchie arrive (pas l'ancienne liste,
  // où un élément déplacé a encore son ancien parent).
  const [aRendreVisible, setARendreVisible] = useState<{ id: string; listeAvant: T[] } | null>(null);

  if (aRendreVisible && liste !== aRendreVisible.listeAvant) {
    const ancetres = idsAncetres(liste, aRendreVisible.id);
    setARendreVisible(null);
    setIdsOuverts((ouverts) => new Set([...ouverts, ...ancetres]));
  }

  const selection = liste.find((element) => element.id === idSelectionne);

  const optionsParent = useMemo(() => {
    const exclus = selection ? idsDescendants(liste, selection.id).add(selection.id) : new Set();
    return aplatirArbre(arbre).filter((option) => !exclus.has(option.id));
  }, [arbre, liste, selection]);

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
      if (succes.idSelectionne) setARendreVisible({ id: succes.idSelectionne, listeAvant: liste });
    },
    [liste],
  );

  return {
    arbre,
    idSelectionne,
    idsOuverts,
    messageSucces,
    optionsParent,
    selectionner,
    basculer,
    terminer,
    toutDeplier: () => setIdsOuverts(new Set(idsParents)),
    toutReplier: () => setIdsOuverts(new Set()),
  };
}
