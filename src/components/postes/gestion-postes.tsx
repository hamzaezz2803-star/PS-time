"use client";

import { useMemo } from "react";
import { Briefcase, UserCog } from "lucide-react";
import { supprimerPoste } from "@/app/(connecte)/personnel/postes/actions";
import { GestionArbre } from "@/components/arbre/gestion-arbre";
import type { OptionSelection } from "@/components/ui/champ-selection";
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
  sites,
}: {
  postes: Poste[];
  nombresEmployes: Record<string, number>;
  sites: OptionSelection[];
}) {
  const nomsSites = useMemo(() => new Map(sites.map((site) => [site.valeur, site.libelle])), [sites]);
  return (
    <GestionArbre
      elements={postes}
      comparer={comparerPostes}
      textes={TEXTES}
      icones={ICONES}
      nombresEmployes={nombresEmployes}
      detail={(poste) => [poste.code, poste.siteId && nomsSites.get(poste.siteId)].filter(Boolean).join(" · ")}
      texteRecherche={(poste) => `${poste.nom} ${poste.code}`}
      actionSupprimer={supprimerPoste}
      rendreFormulaire={({ element, optionsParent, onTermine, onAnnuler }) => (
        <FormulairePoste poste={element} optionsParent={optionsParent} sites={sites} onTermine={onTermine} onAnnuler={onAnnuler} />
      )}
    />
  );
}
