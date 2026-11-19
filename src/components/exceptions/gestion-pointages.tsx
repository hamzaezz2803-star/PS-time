"use client";

import { supprimerPointage } from "@/app/(connecte)/exceptions/pointages-manuels/actions";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { GestionSaisie } from "@/components/liste/gestion-saisie";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import type { ReactNode } from "react";
import { FormulairePointage } from "./formulaire-pointage";

const textes = TEXTES_EXCEPTIONS.pointages;

/** Bouton « Nouveau pointage », message de réussite et fenêtres (saisie, suppression) autour de la liste. */
export function GestionPointages({
  employes,
  departements,
  children,
}: {
  employes: EmployeChoisissable[];
  departements: ElementArbre[];
  children: ReactNode;
}) {
  return (
    <GestionSaisie
      textes={textes}
      actionSupprimer={supprimerPointage}
      rendreFormulaire={(proprietes) => <FormulairePointage employes={employes} departements={departements} {...proprietes} />}
    >
      {children}
    </GestionSaisie>
  );
}
