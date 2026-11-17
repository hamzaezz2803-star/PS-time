"use client";

import { useState } from "react";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { ListeOnglets, PanneauOnglet } from "@/components/ui/onglets";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";
import type { RegleHoraireListe } from "@/types";
import { EmployesHoraireDynamique } from "./employes-horaire-dynamique";
import { ListeRegles } from "./liste-regles";

const BASE = "horaire-dynamique";

/** Page Horaire dynamique : onglet des règles, et onglet des employés concernés. */
export function GestionHoraireDynamique({
  regles,
  profils,
  employes,
  departements,
  selection,
}: {
  regles: RegleHoraireListe[];
  profils: OptionSelection[];
  employes: EmployeChoisissable[];
  departements: ElementArbre[];
  selection: string[];
}) {
  const [actif, setActif] = useState("regles");
  const onglets = [
    { id: "regles", libelle: `${textes.onglets.regles} (${regles.length})` },
    { id: "employes", libelle: `${textes.onglets.employes} (${selection.length})` },
  ];

  return (
    <div>
      <ListeOnglets base={BASE} onglets={onglets} actif={actif} onChanger={setActif} libelle={textes.onglets.libelle} />
      <PanneauOnglet base={BASE} id="regles" actif={actif}>
        <ListeRegles regles={regles} profils={profils} />
      </PanneauOnglet>
      <PanneauOnglet base={BASE} id="employes" actif={actif}>
        <EmployesHoraireDynamique employes={employes} departements={departements} selection={selection} />
      </PanneauOnglet>
    </div>
  );
}
