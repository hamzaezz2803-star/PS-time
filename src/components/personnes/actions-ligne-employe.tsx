"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { useActionsEmployes, type EmployeVise } from "./contexte-employes";

const { liste: textes } = TEXTES_PERSONNES;

/** Boutons de la dernière colonne : voir la fiche, modifier, supprimer. */
export function ActionsLigneEmploye({ employe }: { employe: EmployeVise }) {
  const actions = useActionsEmployes();
  return (
    <div className="flex items-center justify-end gap-0.5">
      <BoutonIcone libelle={textes.voir(employe.nomComplet)} Icone={Eye} onClick={() => actions.voir(employe)} />
      <BoutonIcone libelle={textes.modifier(employe.nomComplet)} Icone={Pencil} onClick={() => actions.modifier(employe)} />
      <BoutonIcone libelle={textes.supprimer(employe.nomComplet)} Icone={Trash2} onClick={() => actions.supprimer(employe)} estDanger />
    </div>
  );
}
