"use client";

import { supprimerDepartement } from "@/app/(connecte)/personnel/departements/actions";
import { GestionArbre } from "@/components/arbre/gestion-arbre";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import { FormulaireDepartement } from "./formulaire-departement";

const TEXTES = { ...TEXTES_DEPARTEMENTS.formulaire, ...TEXTES_DEPARTEMENTS.arbre };

/** Liste des départements en arbre ; création, modification et suppression en fenêtre. */
export function GestionDepartements({ departements }: { departements: ElementArbre[] }) {
  return (
    <GestionArbre
      elements={departements}
      textes={TEXTES}
      actionSupprimer={supprimerDepartement}
      rendreFormulaire={({ element, optionsParent, onTermine, onAnnuler }) => (
        <FormulaireDepartement departement={element} optionsParent={optionsParent} onTermine={onTermine} onAnnuler={onAnnuler} />
      )}
    />
  );
}
