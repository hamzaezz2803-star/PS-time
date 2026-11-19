"use client";

import type { ReactNode } from "react";
import { supprimerAbsence } from "@/app/(connecte)/exceptions/absences/actions";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { GestionSaisie } from "@/components/liste/gestion-saisie";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_ABSENCES } from "@/lib/textes/absences";
import type { EvenementSaisissable } from "@/types";
import { FormulaireAbsence } from "./formulaire-absence";

/** Bouton « Nouvelle absence », message de réussite et fenêtres (saisie, suppression) autour de la liste. */
export function GestionAbsences({
  employes,
  departements,
  evenements,
  children,
}: {
  employes: EmployeChoisissable[];
  departements: ElementArbre[];
  evenements: EvenementSaisissable[];
  children: ReactNode;
}) {
  return (
    <GestionSaisie
      textes={TEXTES_ABSENCES}
      actionSupprimer={supprimerAbsence}
      rendreFormulaire={(proprietes) => <FormulaireAbsence employes={employes} departements={departements} evenements={evenements} {...proprietes} />}
    >
      {children}
    </GestionSaisie>
  );
}
