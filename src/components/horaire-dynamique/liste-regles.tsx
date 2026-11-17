"use client";

import { CalendarClock, ClockArrowUp, TriangleAlert } from "lucide-react";
import { supprimerRegle } from "@/app/(connecte)/programme/horaire-dynamique/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { Pastille } from "@/components/ui/pastille";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";
import type { RegleHoraireListe } from "@/types";
import { FormulaireRegle } from "./formulaire-regle";
import { InterrupteurRegle } from "./interrupteur-regle";
import { JoursSemaine } from "./jours-semaine";

const COLONNES: ColonneListe<RegleHoraireListe>[] = [
  {
    titre: textes.colonnes.fenetre,
    rendu: (regle) => <span className="tabular-nums">{textes.fenetre(minutesVersHeure(regle.debut), minutesVersHeure(regle.fin))}</span>,
  },
  {
    titre: textes.colonnes.profil,
    rendu: (regle) => (
      <Pastille Icone={CalendarClock}>
        <span className="font-mono">{regle.profilCode}</span> {regle.profilNom}
      </Pastille>
    ),
  },
  { titre: textes.colonnes.jours, estSecondaire: true, rendu: (regle) => <JoursSemaine jours={regle.jours} /> },
  { titre: textes.colonnes.etat, rendu: (regle) => <InterrupteurRegle id={regle.id} estActif={regle.estActif} /> },
];

/** Règles de reconnaissance : liste, création, modification, activation et suppression. */
export function ListeRegles({ regles, profils }: { regles: RegleHoraireListe[]; profils: OptionSelection[] }) {
  return (
    <div className="flex flex-col gap-4">
      {profils.length === 0 && (
        <p className="flex items-start gap-2.5 rounded-lg border border-attention/40 bg-attention/5 p-3 text-sm text-texte">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-attention" aria-hidden="true" />
          {textes.manqueProfil}
        </p>
      )}
      <GestionListe
        elements={regles}
        colonnes={COLONNES}
        textes={textes}
        icone={ClockArrowUp}
        rendreFormulaire={(proprietes) => <FormulaireRegle {...proprietes} regles={regles} profils={profils} />}
        actionSupprimer={supprimerRegle}
      />
    </div>
  );
}
