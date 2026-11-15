"use client";

import { useMemo } from "react";
import { UserRound, UsersRound } from "lucide-react";
import { supprimerGroupe } from "@/app/(connecte)/programme/groupes/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Pastille } from "@/components/ui/pastille";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { EmployeSelection, Groupe } from "@/types";
import { FormulaireGroupe } from "./formulaire-groupe";

const textes = TEXTES_PROGRAMME.groupes;

const COLONNES: ColonneListe<Groupe>[] = [
  { titre: textes.colonnes.nom, rendu: (groupe) => groupe.nom },
  {
    titre: textes.colonnes.membres,
    rendu: (groupe) => (
      <Pastille Icone={UserRound} ton={groupe.membres.length > 0 ? "info" : "neutre"}>
        {textes.nombreMembres(groupe.membres.length)}
      </Pastille>
    ),
  },
  {
    titre: textes.colonnes.description,
    estSecondaire: true,
    rendu: (groupe) => <span className="text-texte-secondaire">{groupe.description}</span>,
  },
];

/** Liste des groupes, avec création, modification (membres compris) et suppression en fenêtre. */
export function GestionGroupes({ groupes, employes }: { groupes: Groupe[]; employes: EmployeSelection[] }) {
  const nomsGroupes = useMemo(() => new Map(groupes.map((groupe) => [groupe.id, groupe.nom])), [groupes]);
  return (
    <GestionListe
      elements={groupes}
      colonnes={COLONNES}
      textes={textes}
      icone={UsersRound}
      rendreFormulaire={(proprietes) => <FormulaireGroupe {...proprietes} employes={employes} nomsGroupes={nomsGroupes} />}
      actionSupprimer={supprimerGroupe}
    />
  );
}
