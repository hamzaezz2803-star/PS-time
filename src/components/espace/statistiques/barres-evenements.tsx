import { CalendarX2, Plane } from "lucide-react";
import { STATISTIQUES_DEPARTEMENTS_MAX } from "@/lib/constantes";
import type { JoursEvenement } from "@/lib/metier/statistiques-presence";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";

const textes = TEXTES_PRESENCE.statistiques.graphiques;

/** Barres horizontales : jours retenus par événement (congé, maladie, formation...), du plus fréquent au moins fréquent. */
export function BarresEvenements({ lignes, periode }: { lignes: JoursEvenement[]; periode: number }) {
  const affichees = lignes.slice(0, STATISTIQUES_DEPARTEMENTS_MAX);
  const maximum = Math.max(1, ...affichees.map((ligne) => ligne.jours));
  return (
    <figure className="flex flex-col gap-3">
      <figcaption>
        <span className="block text-base font-semibold text-marine">{textes.evenements}</span>
        <span className="block text-sm text-texte-secondaire">{textes.evenementsAide(periode)}</span>
      </figcaption>
      {affichees.length === 0 ? (
        <p className="rounded-lg bg-fond px-3 py-4 text-sm text-texte-secondaire">{textes.evenementsVide}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {affichees.map((ligne) => {
            const Icone = ligne.type === "presence" ? Plane : CalendarX2;
            return (
              <li key={ligne.code} className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Icone className="size-4 shrink-0 text-texte-secondaire" aria-hidden="true" />
                    <span className="sr-only">{textes.typesEvenement[ligne.type]} :</span>
                    <span className="font-mono font-semibold text-texte">{ligne.code}</span>
                    <span className="truncate text-texte-secondaire">{ligne.nom}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-texte">{textes.nombreJours(ligne.jours)}</span>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-ciel" aria-hidden="true">
                  <span className={`block h-full rounded-full ${ligne.type === "presence" ? "bg-primaire" : "bg-graphe-justifie"}`} style={{ width: `${(ligne.jours / maximum) * 100}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}
