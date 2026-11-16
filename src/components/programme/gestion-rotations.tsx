"use client";

import { useMemo } from "react";
import { CalendarDays, Repeat } from "lucide-react";
import { supprimerRotation } from "@/app/(connecte)/programme/rotations/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Pastille } from "@/components/ui/pastille";
import { formaterDuree } from "@/lib/metier/programme";
import { theoriqueMinutes } from "@/lib/metier/profil-horaire";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { ProfilHoraire, Rotation } from "@/types";
import { FormulaireRotation } from "./formulaire-rotation";

const textes = TEXTES_PROGRAMME.rotations;

const COLONNES: ColonneListe<Rotation>[] = [
  { titre: textes.colonnes.nom, rendu: (rotation) => rotation.nom },
  {
    titre: textes.colonnes.type,
    rendu: (rotation) =>
      rotation.type === "hebdomadaire" ? (
        <Pastille Icone={CalendarDays}>{textes.typeCourt.hebdomadaire}</Pastille>
      ) : (
        <Pastille Icone={Repeat} ton="neutre">{textes.typeCourt.cycle(rotation.nombreJours)}</Pastille>
      ),
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
export function GestionRotations({ rotations, profils }: { rotations: Rotation[]; profils: ProfilHoraire[] }) {
  const options = useMemo(
    () =>
      profils.map((profil) => ({
        valeur: profil.id,
        libelle: profil.type === "repos" ? `${profil.code} · ${profil.nom}` : `${profil.code} · ${profil.nom} (${formaterDuree(theoriqueMinutes(profil.plages))})`,
      })),
    [profils],
  );
  return (
    <GestionListe
      elements={rotations}
      colonnes={COLONNES}
      textes={textes}
      icone={Repeat}
      rendreFormulaire={(proprietes) => <FormulaireRotation {...proprietes} optionsProfils={options} />}
      actionSupprimer={supprimerRotation}
    />
  );
}
