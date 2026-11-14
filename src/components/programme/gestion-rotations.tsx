"use client";

import { useMemo } from "react";
import { Repeat } from "lucide-react";
import { supprimerRotation } from "@/app/(connecte)/programme/rotations/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Calendrier, Rotation } from "@/types";
import { FormulaireRotation } from "./formulaire-rotation";

const textes = TEXTES_PROGRAMME.rotations;

const COLONNES: ColonneListe<Rotation>[] = [
  { titre: textes.colonnes.nom, rendu: (rotation) => rotation.nom },
  {
    titre: textes.colonnes.type,
    rendu: (rotation) =>
      rotation.type === "hebdomadaire" ? textes.typeCourt.hebdomadaire : textes.typeCourt.cycle(rotation.nombreJours),
  },
  {
    titre: textes.colonnes.jours,
    estSecondaire: true,
    rendu: (rotation) => (
      <span className="tabular-nums">{textes.joursTravailles(Object.keys(rotation.jours).length, rotation.nombreJours)}</span>
    ),
  },
];

/** Liste des rotations, avec création, modification et suppression en fenêtre. */
export function GestionRotations({ rotations, calendriers }: { rotations: Rotation[]; calendriers: Calendrier[] }) {
  const options = useMemo(
    () =>
      calendriers.map((calendrier) => ({
        valeur: calendrier.id,
        libelle: `${calendrier.nom} (${minutesVersHeure(calendrier.debutMinutes)} – ${minutesVersHeure(calendrier.finMinutes)})`,
      })),
    [calendriers],
  );
  return (
    <GestionListe
      elements={rotations}
      colonnes={COLONNES}
      textes={textes}
      icone={Repeat}
      rendreFormulaire={(proprietes) => <FormulaireRotation {...proprietes} optionsCalendriers={options} />}
      actionSupprimer={supprimerRotation}
    />
  );
}
