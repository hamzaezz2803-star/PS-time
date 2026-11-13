"use client";

import { supprimerDepartement } from "@/app/(connecte)/personnel/departements/actions";
import { ArbreHierarchique } from "@/components/arbre/arbre-hierarchique";
import { PanneauArbre } from "@/components/arbre/panneau-arbre";
import { PanneauEdition } from "@/components/arbre/panneau-edition";
import { SuppressionElement } from "@/components/arbre/suppression-element";
import { useGestionArbre } from "@/components/arbre/use-gestion-arbre";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import { FormulaireDepartement } from "./formulaire-departement";

const { arbre: textesArbre, formulaire: textes } = TEXTES_DEPARTEMENTS;

/** Vue complète : arbre à gauche, formulaire de création ou de modification à droite. */
export function GestionDepartements({ departements }: { departements: ElementArbre[] }) {
  const gestion = useGestionArbre(departements);
  const { selection } = gestion;

  const resume = selection
    ? [
        gestion.parent ? textesArbre.rattacheA(gestion.parent.nom) : textesArbre.principal,
        textesArbre.sousDepartements(gestion.nombreEnfants),
      ]
    : [textes.sousTitreCreation];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(20rem,5fr)_7fr]">
      <PanneauArbre
        titre={textesArbre.titre}
        total={textesArbre.total(departements.length)}
        textes={textesArbre}
        estEnCreation={!selection}
        onToutDeplier={gestion.toutDeplier}
        onToutReplier={gestion.toutReplier}
        onNouveau={() => gestion.selectionner(null)}
      >
        <ArbreHierarchique
          noeuds={gestion.arbre}
          idSelectionne={gestion.idSelectionne}
          idsOuverts={gestion.idsOuverts}
          onBasculer={gestion.basculer}
          onSelectionner={gestion.selectionner}
          textes={textesArbre}
        />
      </PanneauArbre>

      <PanneauEdition
        titre={selection ? textes.titreModification(selection.nom) : textes.titreCreation}
        resume={resume}
        messageSucces={gestion.messageSucces}
      >
        <FormulaireDepartement
          // Recréé quand le département change en base : les valeurs par défaut suivent.
          key={selection ? `formulaire-${selection.id}-${selection.parentId}-${selection.nom}` : "formulaire-nouveau"}
          departement={selection}
          optionsParent={gestion.optionsParent}
          onTermine={gestion.terminer}
        />
        {selection && (
          <SuppressionElement
            key={`suppression-${selection.id}`}
            id={selection.id}
            nom={selection.nom}
            action={supprimerDepartement}
            textes={textes}
            onTermine={gestion.terminer}
          />
        )}
      </PanneauEdition>
    </div>
  );
}
