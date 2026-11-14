"use client";

import { Eye, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { cn } from "@/lib/utils";
import { useActionsEmployes, type EmployeVise } from "./contexte-employes";

const { liste: textes } = TEXTES_PERSONNES;

function BoutonIcone({
  libelle,
  Icone,
  onClick,
  estDanger = false,
}: {
  libelle: string;
  Icone: LucideIcon;
  onClick: () => void;
  estDanger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={libelle}
      title={libelle}
      className={cn(
        "flex size-11 items-center justify-center rounded-md text-texte-secondaire transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire lg:size-9",
        estDanger ? "hover:bg-erreur/5 hover:text-erreur" : "hover:bg-ciel hover:text-primaire",
      )}
    >
      <Icone className="size-[18px]" aria-hidden="true" />
    </button>
  );
}

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
