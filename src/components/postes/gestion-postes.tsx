"use client";

import { Briefcase, UserCog } from "lucide-react";
import { supprimerPoste } from "@/app/(connecte)/personnel/postes/actions";
import { GestionArbre } from "@/components/arbre/gestion-arbre";
import { comparerPostes } from "@/lib/metier/postes";
import { TEXTES_POSTES } from "@/lib/textes/postes";
import type { Poste } from "@/types";
import { FormulairePoste } from "./formulaire-poste";

const TEXTES = { ...TEXTES_POSTES.formulaire, ...TEXTES_POSTES.arbre };
/** Un poste qui encadre d'autres postes est un responsable ; un poste simple, une mallette. */
const ICONES = { parent: UserCog, enfant: Briefcase };

/** Hiérarchie des postes (triée par ordre d'affichage) ; création, modification et suppression en fenêtre. */
export function GestionPostes({
  postes,
  nombresEmployes,
}: {
  postes: Poste[];
  nombresEmployes: Record<string, number>;
}) {
  return (
    <GestionArbre
      elements={postes}
      comparer={comparerPostes}
      textes={TEXTES}
      icones={ICONES}
      nombresEmployes={nombresEmployes}
      detail={(poste) => poste.code}
      texteRecherche={(poste) => `${poste.nom} ${poste.code}`}
      actionSupprimer={supprimerPoste}
      rendreFormulaire={({ element, optionsParent, onTermine, onAnnuler }) => (
        <FormulairePoste poste={element} optionsParent={optionsParent} onTermine={onTermine} onAnnuler={onAnnuler} />
      )}
    />
  );
}
