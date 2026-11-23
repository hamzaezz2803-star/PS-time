"use client";

import type { ReactNode } from "react";
import { supprimerDroit } from "@/app/(connecte)/presence/droits-conges/actions";
import type { GroupeChoisissable } from "@/components/employes/choix-cible-employes";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { GestionSaisie } from "@/components/liste/gestion-saisie";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_DROITS_CONGES } from "@/lib/textes/droits-conges";
import type { DroitCongeListe, EvenementDroit } from "@/types";
import { FormulaireCreationDroits, FormulaireModificationDroit } from "./formulaire-droit";

/** Bouton « Consulter les droits », message de réussite et fenêtres (attribution, modification, suppression). */
export function GestionDroits({
  droits,
  employes,
  groupes,
  departements,
  evenements,
  children,
}: {
  droits: DroitCongeListe[];
  employes: EmployeChoisissable[];
  groupes: GroupeChoisissable[];
  departements: ElementArbre[];
  evenements: EvenementDroit[];
  children: ReactNode;
}) {
  return (
    <GestionSaisie
      textes={TEXTES_DROITS_CONGES}
      actionSupprimer={supprimerDroit}
      rendreFormulaire={(proprietes) => <FormulaireCreationDroits employes={employes} groupes={groupes} departements={departements} evenements={evenements} {...proprietes} />}
      rendreModification={(id, proprietes) => {
        const droit = droits.find((candidat) => candidat.id === id);
        return droit ? <FormulaireModificationDroit droit={droit} {...proprietes} /> : null;
      }}
    >
      {children}
    </GestionSaisie>
  );
}
