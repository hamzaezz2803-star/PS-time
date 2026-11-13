"use client";

import { supprimerPoste } from "@/app/(connecte)/personnel/postes/actions";
import { ArbreHierarchique } from "@/components/arbre/arbre-hierarchique";
import { PanneauArbre } from "@/components/arbre/panneau-arbre";
import { PanneauEdition } from "@/components/arbre/panneau-edition";
import { SuppressionElement } from "@/components/arbre/suppression-element";
import { useGestionArbre } from "@/components/arbre/use-gestion-arbre";
import { comparerPostes } from "@/lib/metier/postes";
import { TEXTES_POSTES } from "@/lib/textes/postes";
import type { Poste } from "@/types";
import { FormulairePoste } from "./formulaire-poste";

const { arbre: textesArbre, formulaire: textes } = TEXTES_POSTES;

/** Vue complète : hiérarchie des postes à gauche, formulaire à droite. */
export function GestionPostes({ postes }: { postes: Poste[] }) {
  const gestion = useGestionArbre(postes, comparerPostes);
  const { selection } = gestion;

  const resume = selection
    ? [
        textesArbre.numero(selection.code),
        gestion.parent ? textesArbre.rattacheA(gestion.parent.nom) : textesArbre.principal,
        textesArbre.sousPostes(gestion.nombreEnfants),
      ]
    : [textes.sousTitreCreation];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(20rem,5fr)_7fr]">
      <PanneauArbre
        titre={textesArbre.titre}
        total={textesArbre.total(postes.length)}
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
          detail={(poste) => poste.code}
        />
      </PanneauArbre>

      <PanneauEdition
        titre={selection ? textes.titreModification(selection.nom) : textes.titreCreation}
        resume={resume}
        messageSucces={gestion.messageSucces}
      >
        <FormulairePoste
          // Recréé quand le poste change en base : les valeurs par défaut suivent.
          key={
            selection
              ? `formulaire-${selection.id}-${selection.code}-${selection.nom}-${selection.ordre}-${selection.parentId}`
              : "formulaire-nouveau"
          }
          poste={selection}
          optionsParent={gestion.optionsParent}
          onTermine={gestion.terminer}
        />
        {selection && (
          <SuppressionElement
            key={`suppression-${selection.id}`}
            id={selection.id}
            nom={selection.nom}
            action={supprimerPoste}
            textes={textes}
            onTermine={gestion.terminer}
          />
        )}
      </PanneauEdition>
    </div>
  );
}
