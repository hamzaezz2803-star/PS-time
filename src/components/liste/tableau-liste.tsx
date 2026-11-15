"use client";

import { Pencil, Trash2, type LucideIcon } from "lucide-react";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { cn } from "@/lib/utils";
import type { ColonneListe } from "./gestion-liste";

/** Tableau d'une liste simple : la première colonne ouvre la modification, actions en bout de ligne. */
export function TableauListe<T extends { id: string; nom: string }>({
  elements,
  colonnes,
  icone: Icone,
  idEnEvidence,
  textes,
  onModifier,
  onSupprimer,
}: {
  elements: T[];
  colonnes: ColonneListe<T>[];
  icone: LucideIcon;
  idEnEvidence: string | null;
  textes: { actions: string; modifier: (nom: string) => string; supprimer: (nom: string) => string };
  onModifier: (id: string) => void;
  onSupprimer: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-bordure bg-fond/70 text-texte-secondaire">
          <tr>
            {colonnes.map((colonne) => (
              <th key={colonne.titre} scope="col" className={cn("px-5 py-3 font-semibold", colonne.estSecondaire && "hidden md:table-cell")}>
                {colonne.titre}
              </th>
            ))}
            <th scope="col" className="px-5 py-3 text-right font-semibold">
              <span className="sr-only">{textes.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bordure text-texte">
          {elements.map((element) => (
            <tr
              key={element.id}
              className={cn(
                "group/ligne transition-colors duration-150 hover:bg-fond",
                element.id === idEnEvidence && "bg-ciel/50 hover:bg-ciel/70",
              )}
            >
              {colonnes.map((colonne, index) => (
                <td key={colonne.titre} className={cn("px-5 py-2.5", colonne.estSecondaire && "hidden md:table-cell")}>
                  {index === 0 ? (
                    <button
                      type="button"
                      onClick={() => onModifier(element.id)}
                      className="flex min-h-11 items-center gap-3 rounded-md text-start text-base font-medium text-texte hover:text-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ciel text-primaire">
                        <Icone className="size-4" aria-hidden="true" />
                      </span>
                      {colonne.rendu(element)}
                    </button>
                  ) : (
                    colonne.rendu(element)
                  )}
                </td>
              ))}
              <td className="px-3 py-1.5">
                {/* Toujours visibles au clavier et sur mobile ; plus discrètes sur ordinateur hors survol. */}
                <div className="flex items-center justify-end gap-0.5 transition-opacity duration-150 lg:opacity-60 lg:group-hover/ligne:opacity-100 lg:group-focus-within/ligne:opacity-100">
                  <BoutonIcone libelle={textes.modifier(element.nom)} Icone={Pencil} onClick={() => onModifier(element.id)} />
                  <BoutonIcone libelle={textes.supprimer(element.nom)} Icone={Trash2} onClick={() => onSupprimer(element.id)} estDanger />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
