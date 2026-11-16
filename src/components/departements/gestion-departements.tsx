"use client";

import { useMemo } from "react";
import { Building2, UsersRound } from "lucide-react";
import { supprimerDepartement } from "@/app/(connecte)/personnel/departements/actions";
import { GestionArbre } from "@/components/arbre/gestion-arbre";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import type { Departement } from "@/types";
import { FormulaireDepartement } from "./formulaire-departement";

const TEXTES = { ...TEXTES_DEPARTEMENTS.formulaire, ...TEXTES_DEPARTEMENTS.arbre };
/** Un département qui en regroupe d'autres est un bâtiment ; un sous-département, une équipe. */
const ICONES = { parent: Building2, enfant: UsersRound };

/** Liste des départements en arbre (avec leur site) ; création, modification et suppression en fenêtre. */
export function GestionDepartements({
  departements,
  nombresEmployes,
  sites,
}: {
  departements: Departement[];
  nombresEmployes: Record<string, number>;
  sites: OptionSelection[];
}) {
  const nomsSites = useMemo(() => new Map(sites.map((site) => [site.valeur, site.libelle])), [sites]);
  return (
    <GestionArbre
      elements={departements}
      textes={TEXTES}
      icones={ICONES}
      nombresEmployes={nombresEmployes}
      cumulerSousElements
      detail={(departement) => (departement.siteId ? nomsSites.get(departement.siteId) : undefined)}
      actionSupprimer={supprimerDepartement}
      rendreFormulaire={({ element, optionsParent, onTermine, onAnnuler }) => (
        <FormulaireDepartement departement={element} optionsParent={optionsParent} sites={sites} onTermine={onTermine} onAnnuler={onAnnuler} />
      )}
    />
  );
}
