"use client";

import { ChoixEmployes } from "@/components/employes/choix-employes";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { EmployeSelection } from "@/types";

const textes = TEXTES_PROGRAMME.groupes;

/** Choix des membres d'un groupe : un employé déjà dans un autre groupe l'indique sous son nom. */
export function ChoixMembres({
  employes,
  nomsGroupes,
  idGroupe,
  selectionInitiale,
}: {
  employes: EmployeSelection[];
  nomsGroupes: Map<string, string>;
  idGroupe?: string;
  selectionInitiale: string[];
}) {
  const groupeParEmploye = new Map(employes.map((employe) => [employe.id, employe.groupeId]));
  return (
    <ChoixEmployes
      employes={employes}
      nomChamp="membres"
      selectionInitiale={selectionInitiale}
      textes={textes}
      detail={(employe) => {
        const groupeId = groupeParEmploye.get(employe.id);
        const nomGroupe = groupeId && groupeId !== idGroupe ? nomsGroupes.get(groupeId) : undefined;
        return nomGroupe ? textes.dansGroupe(nomGroupe) : undefined;
      }}
    />
  );
}
