"use client";

import { MessageSucces } from "@/components/ui/message-succes";
import type { DepartementPlat } from "@/lib/metier/arbre-departements";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import type { EtatFormulaireDepartement } from "@/types";
import { FormulaireDepartement, type OptionParent } from "./formulaire-departement";
import { SuppressionDepartement } from "./suppression-departement";

const { arbre: textesArbre, formulaire: textes } = TEXTES_DEPARTEMENTS;
type Succes = NonNullable<EtatFormulaireDepartement["succes"]>;

/** Panneau de droite : résumé du département choisi, formulaire et suppression. */
export function PanneauDepartement({
  selection,
  departements,
  optionsParent,
  messageSucces,
  onTermine,
}: {
  selection?: DepartementPlat;
  departements: DepartementPlat[];
  optionsParent: OptionParent[];
  messageSucces?: string;
  onTermine: (succes: Succes) => void;
}) {
  const nombreEnfants = selection
    ? departements.filter((d) => d.parentId === selection.id).length
    : 0;
  const parent = selection?.parentId
    ? departements.find((d) => d.id === selection.parentId)
    : undefined;
  const resume = selection
    ? [
        parent ? textesArbre.rattacheA(parent.nom) : textesArbre.principal,
        textesArbre.sousDepartements(nombreEnfants),
      ]
    : [textes.sousTitreCreation];

  return (
    <section
      className="overflow-hidden rounded-xl border border-bordure bg-surface"
      aria-labelledby="titre-formulaire"
    >
      <div className="border-b border-bordure px-5 py-4 sm:px-6">
        <h2 id="titre-formulaire" className="truncate text-lg font-semibold text-marine">
          {selection ? textes.titreModification(selection.nom) : textes.titreCreation}
        </h2>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-texte-secondaire">
          {resume.map((element) => (
            <li key={element}>{element}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <MessageSucces message={messageSucces} />
        <FormulaireDepartement
          // Recréé quand le département change en base : les valeurs par défaut suivent.
          key={
            selection
              ? `formulaire-${selection.id}-${selection.parentId}-${selection.nom}`
              : "formulaire-nouveau"
          }
          departement={selection}
          parentParDefaut={null}
          optionsParent={optionsParent}
          onTermine={onTermine}
        />
        {selection && (
          <SuppressionDepartement
            key={`suppression-${selection.id}`}
            id={selection.id}
            nom={selection.nom}
            onTermine={onTermine}
          />
        )}
      </div>
    </section>
  );
}
