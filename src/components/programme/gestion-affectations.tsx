"use client";

import { CalendarRange } from "lucide-react";
import { supprimerAffectation } from "@/app/(connecte)/programme/affectations/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { formaterJour } from "@/lib/formats";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Affectation } from "@/types";
import { FormulaireAffectation, type OptionsAffectation } from "./formulaire-affectation";

const textes = TEXTES_PROGRAMME.affectations;

const COLONNES: ColonneListe<Affectation>[] = [
  { titre: textes.colonnes.cible, rendu: (affectation) => affectation.cible },
  { titre: textes.colonnes.rotation, rendu: (affectation) => affectation.rotation },
  {
    titre: textes.colonnes.periode,
    estSecondaire: true,
    rendu: (affectation) => (
      <span className="tabular-nums">
        {textes.periode(formaterJour(affectation.dateDebut), affectation.dateFin && formaterJour(affectation.dateFin))}
      </span>
    ),
  },
];

/** Liste des affectations, avec création, modification et suppression en fenêtre. */
export function GestionAffectations({ affectations, options }: { affectations: Affectation[]; options: OptionsAffectation }) {
  const manqueDonnees = options.rotations.length === 0 || (options.groupes.length === 0 && options.employes.length === 0);
  return (
    <div className="flex flex-col gap-4">
      {manqueDonnees && (
        <p className="rounded-lg border border-attention/40 bg-attention/5 p-3 text-sm text-texte">{textes.manque}</p>
      )}
      <GestionListe
        elements={affectations}
        colonnes={COLONNES}
        textes={textes}
        icone={CalendarRange}
        rendreFormulaire={(proprietes) => <FormulaireAffectation {...proprietes} options={options} />}
        actionSupprimer={supprimerAffectation}
      />
    </div>
  );
}
