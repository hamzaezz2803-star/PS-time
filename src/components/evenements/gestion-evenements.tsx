"use client";

import { CalendarCheck, CalendarX2, CircleCheck, CircleOff, Plane, ShieldCheck, Tags } from "lucide-react";
import { supprimerEvenement } from "@/app/(connecte)/exceptions/evenements/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Pastille } from "@/components/ui/pastille";
import { minutesEnHeures } from "@/lib/metier/evenements";
import { TEXTES_EVENEMENTS as textes } from "@/lib/textes/evenements";
import type { Evenement } from "@/types";
import { FormulaireEvenement } from "./formulaire-evenement";
import { ReperePriorite } from "./jauge-priorite";

/** Code, libellé et particularités (type, prioritaire, masqué) : jamais la couleur seule. */
function Identite({ evenement }: { evenement: Evenement }) {
  const estAbsence = evenement.type === "absence";
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-9 min-w-11 items-center justify-center rounded-md bg-marine px-2 font-mono text-sm font-semibold text-white">{evenement.code}</span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium text-texte">{evenement.nom}</span>
        <span className="flex flex-wrap gap-1.5">
          <Pastille ton={estAbsence ? "attention" : "info"} Icone={estAbsence ? CalendarX2 : Plane}>
            {textes.types[evenement.type]}
          </Pastille>
          {evenement.estVisiblePlanning ? (
            <Pastille ton="succes" Icone={CircleCheck}>{textes.actif}</Pastille>
          ) : (
            <Pastille ton="neutre" Icone={CircleOff}>{textes.nonActif}</Pastille>
          )}
          {evenement.estPrioritaireSurPointages && <Pastille ton="neutre" Icone={ShieldCheck}>{textes.prioritaire}</Pastille>}
          {evenement.estSoumisDroits && <Pastille ton="neutre" Icone={CalendarCheck}>{textes.soumisDroits}</Pastille>}
        </span>
      </span>
    </span>
  );
}

/** Unité de saisie, avec la durée pour un événement en heures (ex. « Heures · 2 h »). */
function Saisie({ evenement }: { evenement: Evenement }) {
  const unite = textes.unites[evenement.uniteSaisie];
  const duree = evenement.dureeMinutes ? ` · ${textes.dureeEnHeures(minutesEnHeures(evenement.dureeMinutes))}` : "";
  return <span className="text-sm text-texte">{`${unite}${duree}`}</span>;
}

const COLONNES: ColonneListe<Evenement>[] = [
  { titre: textes.colonnes.evenement, rendu: (evenement) => <Identite evenement={evenement} /> },
  { titre: textes.colonnes.saisie, estSecondaire: true, rendu: (evenement) => <Saisie evenement={evenement} /> },
  { titre: textes.colonnes.priorite, rendu: (evenement) => <ReperePriorite valeur={evenement.priorite} /> },
  {
    titre: textes.colonnes.paie,
    estSecondaire: true,
    rendu: (evenement) =>
      evenement.codePaie ? (
        <span className="font-mono text-sm text-texte">{evenement.codePaie}</span>
      ) : (
        <span className="text-sm text-texte-secondaire">{textes.nonTransmis}</span>
      ),
  },
];

/** Liste des événements, avec création, modification et suppression en fenêtre. */
export function GestionEvenements({ evenements }: { evenements: Evenement[] }) {
  return (
    <GestionListe
      elements={evenements}
      colonnes={COLONNES}
      textes={textes}
      icone={Tags}
      rendreFormulaire={(proprietes) => <FormulaireEvenement {...proprietes} />}
      actionSupprimer={supprimerEvenement}
    />
  );
}
