"use client";

import { useSyncExternalStore } from "react";
import { formaterDate } from "@/lib/formats";
import { cn } from "@/lib/utils";

const MILLISECONDES_PAR_MINUTE = 60_000;

function abonner(rappel: () => void) {
  const minuterie = setInterval(rappel, MILLISECONDES_PAR_MINUTE / 4);
  return () => clearInterval(minuterie);
}
const minuteActuelle = () => Math.floor(Date.now() / MILLISECONDES_PAR_MINUTE);
const minuteServeur = () => null;

/** Date du jour à Casablanca (change à minuit sans recharger la page). `attente` : couleur de l'emplacement avant l'affichage. */
export function DateDuJour({ attente = "bg-canevas" }: { attente?: string }) {
  const minute = useSyncExternalStore(abonner, minuteActuelle, minuteServeur);
  if (minute === null) return <span className={cn("inline-block h-5 w-32 rounded", attente)} aria-hidden="true" />;
  return <span className="capitalize">{formaterDate(new Date(minute * MILLISECONDES_PAR_MINUTE))}</span>;
}
