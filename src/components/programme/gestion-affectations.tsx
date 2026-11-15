"use client";

import { CalendarRange, Repeat, TriangleAlert, UserRound, UsersRound } from "lucide-react";
import { supprimerAffectation } from "@/app/(connecte)/programme/affectations/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Pastille } from "@/components/ui/pastille";
import { formaterJour } from "@/lib/formats";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Affectation } from "@/types";
import { FormulaireAffectation, type OptionsAffectation } from "./formulaire-affectation";

const textes = TEXTES_PROGRAMME.affectations;

const COLONNES: ColonneListe<Affectation>[] = [
  {
    titre: textes.colonnes.cible,
    rendu: (affectation) => (
      <span className="inline-flex flex-wrap items-center gap-2">
        {affectation.cible}
        {affectation.groupeId !== null ? (
          <Pastille Icone={UsersRound} ton="neutre">{textes.cibleGroupe}</Pastille>
        ) : (
          <Pastille Icone={UserRound} ton="neutre">{textes.cibleEmploye}</Pastille>
        )}
      </span>
    ),
  },
  { titre: textes.colonnes.rotation, rendu: (affectation) => <Pastille Icone={Repeat}>{affectation.rotation}</Pastille> },
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
        <p className="flex items-start gap-2.5 rounded-lg border border-attention/40 bg-attention/5 p-3 text-sm text-texte">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-attention" aria-hidden="true" />
          {textes.manque}
        </p>
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
