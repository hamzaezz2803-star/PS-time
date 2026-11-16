"use client";

import { Factory } from "lucide-react";
import { supprimerSite } from "@/app/(connecte)/personnel/sites/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { TEXTES_SITES as textes } from "@/lib/textes/sites";
import type { Site } from "@/types";
import { FormulaireSite } from "./formulaire-site";

const COLONNES: ColonneListe<Site>[] = [
  { titre: textes.colonnes.nom, rendu: (site) => site.nom },
  {
    titre: textes.colonnes.rattachements,
    rendu: (site) => (
      <span className="text-sm tabular-nums text-texte-secondaire">
        {textes.rattachements(site.nombreDepartements, site.nombrePostes, site.nombreEmployes)}
      </span>
    ),
  },
  {
    titre: textes.colonnes.adresse,
    estSecondaire: true,
    rendu: (site) => <span className="text-texte-secondaire">{site.adresse}</span>,
  },
];

/** Liste des sites, avec création, modification et suppression en fenêtre. */
export function GestionSites({ sites }: { sites: Site[] }) {
  return (
    <GestionListe
      elements={sites}
      colonnes={COLONNES}
      textes={textes}
      icone={Factory}
      rendreFormulaire={(proprietes) => <FormulaireSite {...proprietes} />}
      actionSupprimer={supprimerSite}
    />
  );
}
