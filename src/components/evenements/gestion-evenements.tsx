"use client";

import { CalendarCheck, CalendarOff, CalendarX2, EyeOff, Plane, ShieldCheck, Tags } from "lucide-react";
import { supprimerEvenement } from "@/app/(connecte)/exceptions/evenements/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Pastille } from "@/components/ui/pastille";
import { formaterJour } from "@/lib/formats";
import { estPrisAutoriseLe } from "@/lib/metier/evenements";
import { TEXTES_EVENEMENTS as textes } from "@/lib/textes/evenements";
import type { Evenement } from "@/types";
import { FormulaireEvenement } from "./formulaire-evenement";

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
          {evenement.estPrioritaireSurPointages && <Pastille ton="neutre" Icone={ShieldCheck}>{textes.prioritaire}</Pastille>}
          {!evenement.estVisiblePlanning && <Pastille ton="neutre" Icone={EyeOff}>{textes.masque}</Pastille>}
        </span>
      </span>
    </span>
  );
}

/** Périodes de prise lisibles, et si l'événement peut être pris aujourd'hui. */
function PeriodePrise({ evenement, aujourdhui }: { evenement: Evenement; aujourdhui: string }) {
  if (evenement.periodes.length === 0) return <span className="text-sm text-texte-secondaire">{textes.touteAnnee}</span>;
  const estOuvert = estPrisAutoriseLe(evenement.periodes, aujourdhui);
  return (
    <span className="flex flex-col items-start gap-1">
      <span className="flex flex-col text-sm tabular-nums text-texte">
        {evenement.periodes.map((periode) => (
          <span key={periode.debut}>{textes.periode(formaterJour(periode.debut), formaterJour(periode.fin))}</span>
        ))}
      </span>
      <Pastille ton={estOuvert ? "succes" : "neutre"} Icone={estOuvert ? CalendarCheck : CalendarOff}>
        {estOuvert ? textes.ouvertAujourdhui : textes.fermeAujourdhui}
      </Pastille>
    </span>
  );
}

function colonnes(aujourdhui: string): ColonneListe<Evenement>[] {
  return [
    { titre: textes.colonnes.evenement, rendu: (evenement) => <Identite evenement={evenement} /> },
    {
      titre: textes.colonnes.saisie,
      estSecondaire: true,
      rendu: (evenement) => (
        <span className="flex flex-col text-sm">
          <span className="text-texte">{evenement.estSaisiEnHeures ? textes.enHeures : textes.aLaJournee}</span>
          <span className="tabular-nums text-texte-secondaire">{textes.priorite(evenement.priorite)}</span>
        </span>
      ),
    },
    { titre: textes.colonnes.periode, rendu: (evenement) => <PeriodePrise evenement={evenement} aujourdhui={aujourdhui} /> },
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
}

/** Liste des événements, avec création, modification et suppression en fenêtre. */
export function GestionEvenements({ evenements, aujourdhui }: { evenements: Evenement[]; aujourdhui: string }) {
  return (
    <GestionListe
      elements={evenements}
      colonnes={colonnes(aujourdhui)}
      textes={textes}
      icone={Tags}
      rendreFormulaire={(proprietes) => <FormulaireEvenement {...proprietes} />}
      actionSupprimer={supprimerEvenement}
    />
  );
}
