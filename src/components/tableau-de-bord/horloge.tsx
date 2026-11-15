"use client";

import { useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { formaterDate, formaterHeure } from "@/lib/formats";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";

const MILLISECONDES_PAR_MINUTE = 60_000;
const INTERVALLE_RAFRAICHISSEMENT_MS = 10_000;

function abonner(rappel: () => void) {
  const minuterie = setInterval(rappel, INTERVALLE_RAFRAICHISSEMENT_MS);
  return () => clearInterval(minuterie);
}

// La minute en cours : la valeur ne change (et l'horloge ne se réaffiche) qu'une fois par minute.
const minuteActuelle = () => Math.floor(Date.now() / MILLISECONDES_PAR_MINUTE);
const minuteServeur = () => null;

/** Date et heure en direct (fuseau de Casablanca), au cœur d'un outil de pointage. */
export function Horloge() {
  const minute = useSyncExternalStore(abonner, minuteActuelle, minuteServeur);
  const maintenant = minute === null ? null : new Date(minute * MILLISECONDES_PAR_MINUTE);

  return (
    <p
      aria-label={TEXTES_NAVIGATION.heureActuelle}
      className="flex h-9 items-center gap-2 rounded-lg border border-bordure bg-fond px-3 text-sm text-texte-secondaire"
    >
      <Clock className="size-4 shrink-0 text-primaire" aria-hidden="true" />
      {maintenant ? (
        <>
          <span className="hidden capitalize sm:inline">{formaterDate(maintenant)}</span>
          <span className="hidden h-4 w-px bg-bordure sm:inline-block" aria-hidden="true" />
          <time
            dateTime={maintenant.toISOString()}
            className="font-semibold tabular-nums text-marine"
          >
            {formaterHeure(maintenant)}
          </time>
        </>
      ) : (
        <span className="inline-block h-5 w-12 rounded bg-canevas" aria-hidden="true" />
      )}
    </p>
  );
}
