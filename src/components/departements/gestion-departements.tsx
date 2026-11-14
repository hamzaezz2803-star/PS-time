"use client";

import { Building2, UsersRound } from "lucide-react";
import { supprimerDepartement } from "@/app/(connecte)/personnel/departements/actions";
import { GestionArbre } from "@/components/arbre/gestion-arbre";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import { FormulaireDepartement } from "./formulaire-departement";

const TEXTES = { ...TEXTES_DEPARTEMENTS.formulaire, ...TEXTES_DEPARTEMENTS.arbre };
/** Un département qui en regroupe d'autres est un bâtiment ; un sous-département, une équipe. */
const ICONES = { parent: Building2, enfant: UsersRound };

/** Liste des départements en arbre ; création, modification et suppression en fenêtre. */
export function GestionDepartements({
  departements,
  nombresEmployes,
}: {
  departements: ElementArbre[];
  nombresEmployes: Record<string, number>;
}) {
  return (
    <GestionArbre
      elements={departements}
      textes={TEXTES}
      icones={ICONES}
      nombresEmployes={nombresEmployes}
      cumulerSousElements
      actionSupprimer={supprimerDepartement}
      rendreFormulaire={({ element, optionsParent, onTermine, onAnnuler }) => (
        <FormulaireDepartement departement={element} optionsParent={optionsParent} onTermine={onTermine} onAnnuler={onAnnuler} />
      )}
    />
  );
}
