"use client";

import { useSyncExternalStore } from "react";
import { CalendarDays } from "lucide-react";
import { HorlogePalettes } from "@/components/ui/horloge-palettes";
import { formaterDate } from "@/lib/formats";
import { TEXTES_ESPACE } from "@/lib/textes/espace";

const MILLISECONDES_PAR_MINUTE = 60_000;

function abonner(rappel: () => void) {
  const minuterie = setInterval(rappel, MILLISECONDES_PAR_MINUTE / 4);
  return () => clearInterval(minuterie);
}
const minuteActuelle = () => Math.floor(Date.now() / MILLISECONDES_PAR_MINUTE);
const minuteServeur = () => null;

/** Date du jour à Casablanca (change à minuit sans recharger la page). */
function DateDuJour() {
  const minute = useSyncExternalStore(abonner, minuteActuelle, minuteServeur);
  if (minute === null) return <span className="inline-block h-5 w-32 rounded bg-canevas" aria-hidden="true" />;
  return <span className="capitalize">{formaterDate(new Date(minute * MILLISECONDES_PAR_MINUTE))}</span>;
}

/** Accueil du tableau de bord : salutation à gauche, horloge à palettes et date du jour à droite. */
export function BanniereAccueil({ nom }: { nom: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-primaire/15 bg-ciel shadow-carte">
      <div className="flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-primaire">{TEXTES_ESPACE.surtitre}</p>
          <h1 className="text-2xl font-bold tracking-tight text-marine sm:text-3xl">{TEXTES_ESPACE.bonjour(nom)}</h1>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5 lg:items-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-texte-secondaire">{TEXTES_ESPACE.heureCasablanca}</p>
          <HorlogePalettes libelle={TEXTES_ESPACE.heureCasablanca} />
          <p className="flex items-center gap-2 text-base font-medium text-marine">
            <CalendarDays className="size-5 text-primaire" aria-hidden="true" />
            <DateDuJour />
          </p>
        </div>
      </div>
    </section>
  );
}
