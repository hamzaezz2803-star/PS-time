"use client";

import { supprimerPoste } from "@/app/(connecte)/personnel/postes/actions";
import { GestionArbre } from "@/components/arbre/gestion-arbre";
import { comparerPostes } from "@/lib/metier/postes";
import { TEXTES_POSTES } from "@/lib/textes/postes";
import type { Poste } from "@/types";
import { FormulairePoste } from "./formulaire-poste";

const TEXTES = { ...TEXTES_POSTES.formulaire, ...TEXTES_POSTES.arbre };

/** Hiérarchie des postes (triée par ordre d'affichage) ; création, modification et suppression en fenêtre. */
export function GestionPostes({ postes }: { postes: Poste[] }) {
  return (
    <GestionArbre
      elements={postes}
      comparer={comparerPostes}
      textes={TEXTES}
      detail={(poste) => poste.code}
      actionSupprimer={supprimerPoste}
      rendreFormulaire={({ element, optionsParent, onTermine, onAnnuler }) => (
        <FormulairePoste poste={element} optionsParent={optionsParent} onTermine={onTermine} onAnnuler={onAnnuler} />
      )}
    />
  );
}
