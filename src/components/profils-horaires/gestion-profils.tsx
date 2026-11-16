"use client";

import { BedDouble, CalendarClock, Fingerprint, UserCheck } from "lucide-react";
import { supprimerProfil } from "@/app/(connecte)/programme/profils-horaires/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Pastille } from "@/components/ui/pastille";
import { formaterDuree } from "@/lib/metier/programme";
import { theoriqueMinutes } from "@/lib/metier/profil-horaire";
import { TEXTES_PROFILS as textes } from "@/lib/textes/profils-horaires";
import type { ProfilHoraire } from "@/types";
import { BarreJournee } from "./barre-journee";
import { FormulaireProfil } from "./formulaire-profil";

function Profil({ profil }: { profil: ProfilHoraire }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-9 min-w-11 items-center justify-center rounded-md bg-marine px-2 font-mono text-sm font-semibold text-white">{profil.code}</span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium text-texte">{profil.nom}</span>
        <span className="flex flex-wrap gap-1.5">
          {profil.type === "repos" ? (
            <Pastille ton="neutre" Icone={BedDouble}>{textes.types.repos}</Pastille>
          ) : (
            <Pastille ton={profil.estBadge ? "info" : "neutre"} Icone={profil.estBadge ? Fingerprint : UserCheck}>
              {profil.estBadge ? textes.badge : textes.nonBadge}
            </Pastille>
          )}
        </span>
      </span>
    </span>
  );
}

const COLONNES: ColonneListe<ProfilHoraire>[] = [
  { titre: textes.colonnes.profil, rendu: (profil) => <Profil profil={profil} /> },
  {
    titre: textes.colonnes.journee,
    estSecondaire: true,
    rendu: (profil) =>
      profil.type === "repos" ? (
        <span className="text-sm text-texte-secondaire">{textes.journeeRepos}</span>
      ) : (
        <BarreJournee plages={profil.plages} avecReperes className="min-w-56" />
      ),
  },
  {
    titre: textes.colonnes.theorique,
    rendu: (profil) => (
      <span className="font-semibold tabular-nums text-marine">{profil.type === "repos" ? textes.types.repos : formaterDuree(theoriqueMinutes(profil.plages))}</span>
    ),
  },
];

/** Liste des profils horaires, avec création, modification et suppression en fenêtre. */
export function GestionProfils({ profils }: { profils: ProfilHoraire[] }) {
  return (
    <GestionListe
      elements={profils}
      colonnes={COLONNES}
      textes={textes}
      icone={CalendarClock}
      rendreFormulaire={(proprietes) => <FormulaireProfil {...proprietes} />}
      actionSupprimer={supprimerProfil}
    />
  );
}
