"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";
import { CHEMIN_ESPACE } from "@/lib/constantes";
import { formaterDate, formaterHeure } from "@/lib/formats";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";
import { DETAIL_GRAND_ECRAN } from "./navigation";

const MILLISECONDES_PAR_MINUTE = 60_000;
const INTERVALLE_RAFRAICHISSEMENT_MS = 10_000;

function abonner(rappel: () => void) {
  const minuterie = setInterval(rappel, INTERVALLE_RAFRAICHISSEMENT_MS);
  return () => clearInterval(minuterie);
}

// La minute en cours : la valeur ne change (et l'horloge ne se réaffiche) qu'une fois par minute.
const minuteActuelle = () => Math.floor(Date.now() / MILLISECONDES_PAR_MINUTE);
const minuteServeur = () => null;

/** Date et heure en direct (fuseau de Casablanca). Masquée sur le tableau de bord, qui a sa grande horloge. */
export function Horloge() {
  const minute = useSyncExternalStore(abonner, minuteActuelle, minuteServeur);
  const maintenant = minute === null ? null : new Date(minute * MILLISECONDES_PAR_MINUTE);
  const chemin = usePathname();
  if (chemin === CHEMIN_ESPACE) return null;

  return (
    <p
      aria-label={TEXTES_NAVIGATION.heureActuelle}
      className="flex h-9 items-center gap-2 rounded-lg border border-bordure bg-fond px-3 text-sm text-texte-secondaire"
    >
      <Clock className="size-4 shrink-0 text-primaire" aria-hidden="true" />
      {maintenant ? (
        <>
          {/* La date ne s'affiche que sur un grand écran, pour laisser la place aux menus. */}
          <span className={cn("capitalize", DETAIL_GRAND_ECRAN)}>{formaterDate(maintenant)}</span>
          <span className={cn("h-4 w-px bg-bordure", DETAIL_GRAND_ECRAN)} aria-hidden="true" />
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
