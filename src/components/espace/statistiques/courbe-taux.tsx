"use client";

import { useState } from "react";
import { hauteurPourcent, segmentsCourbe } from "@/lib/metier/graphiques";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";
import { cn } from "@/lib/utils";
import { InfobulleGraphique } from "./infobulle-graphique";
import { TableauValeurs } from "./tableau-valeurs";

const textes = TEXTES_PRESENCE.statistiques;
const g = textes.graphiques;
/** Axe fixe de 0 à 100 % : les jours restent comparables d'une période à l'autre. */
const GRADUATIONS = [0, 25, 50, 75, 100];
const ETIQUETTES_AXE_MAX = 10;

type Proprietes = {
  id: string;
  titre: string;
  aide: string;
  etiquettes: string[];
  etiquettesLongues: string[];
  /** Taux de présence de chaque jour en %, null quand personne n'était attendu. */
  taux: (number | null)[];
  /** Taux de la période entière (même calcul que le chiffre clé), tracé en pointillé. */
  moyenne: number | null;
};

/**
 * Courbe du taux de présence par jour, faite main en SVG : ligne de la moyenne, légende,
 * infobulle au survol et au clavier, tableau des valeurs. Un jour sans personne attendu coupe la courbe.
 */
export function CourbeTaux({ id, titre, aide, etiquettes, etiquettesLongues, taux, moyenne }: Proprietes) {
  const [actif, setActif] = useState<number | null>(null);
  const formater = (valeur: number | null) => (valeur === null ? g.personneAttendu : textes.pourcentage(valeur));
  const segments = segmentsCourbe(taux, 100);
  const pasEtiquette = Math.ceil(etiquettes.length / ETIQUETTES_AXE_MAX);
  const yMoyenne = moyenne === null ? null : 100 - hauteurPourcent(moyenne, 100);

  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <figcaption>
        <span id={`${id}-titre`} className="block text-base font-semibold text-marine">{titre}</span>
        <span className="block text-sm text-texte-secondaire">{aide}</span>
      </figcaption>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-texte-secondaire" aria-label={titre}>
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-graphe-a-l-heure" aria-hidden="true" />
          {g.tauxValeur}
        </li>
        {moyenne !== null && (
          <li className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-graphe-reference" aria-hidden="true" />
            {g.tauxMoyen} : {textes.pourcentage(moyenne)}
          </li>
        )}
      </ul>

      <div className="relative mt-3 h-44 ps-14" onPointerLeave={() => setActif(null)}>
        {GRADUATIONS.map((tick) => (
          <div key={tick} className="absolute inset-x-0 flex h-0 items-center" style={{ bottom: `${tick}%` }} aria-hidden="true">
            <span className="w-14 shrink-0 whitespace-nowrap pe-2 text-end text-sm tabular-nums text-texte-secondaire">{tick} %</span>
            <span className={cn("h-px flex-1", tick === 0 ? "bg-bordure-champ" : "bg-graphe-grille")} />
          </div>
        ))}

        <div className="absolute inset-y-0 end-0 start-14">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
            {yMoyenne !== null && (
              <line x1="0" x2="100" y1={yMoyenne} y2={yMoyenne} className="stroke-graphe-reference" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
            )}
            {segments.map((segment) => (
              <polyline
                key={segment[0]?.rang}
                points={segment.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                className="stroke-graphe-a-l-heure"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {/* Points en HTML : restent ronds quelle que soit la largeur du graphique. */}
          {segments.flat().map((point) => (
            <span
              key={point.rang}
              aria-hidden="true"
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-graphe-a-l-heure transition-transform duration-150",
                actif === point.rang ? "size-3.5" : "size-2.5",
              )}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            />
          ))}
          <div className="absolute inset-0 flex">
            {etiquettes.map((etiquette, rang) => (
              <div
                key={`${etiquette}-${rang}`}
                tabIndex={0}
                aria-label={`${etiquettesLongues[rang]} : ${g.tauxValeur} ${formater(taux[rang] ?? null)}`}
                onPointerEnter={() => setActif(rang)}
                onFocus={() => setActif(rang)}
                onBlur={() => setActif(null)}
                className={cn(
                  "h-full min-w-0 flex-1 rounded-md outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire",
                  actif === rang && "bg-canevas/50",
                )}
              />
            ))}
          </div>
        </div>
        {actif !== null && (
          <InfobulleGraphique
            rang={actif}
            nombre={etiquettes.length}
            titre={etiquettesLongues[actif] ?? ""}
            lignes={[{ cle: "taux", nom: g.tauxValeur, couleur: "bg-graphe-a-l-heure", valeur: formater(taux[actif] ?? null) }]}
          />
        )}
      </div>
      <div className="flex ps-14 text-sm text-texte-secondaire" aria-hidden="true">
        {etiquettes.map((etiquette, rang) => (
          <span key={`${etiquette}-${rang}`} className="min-w-0 flex-1 truncate text-center">
            {rang % pasEtiquette === 0 || rang === etiquettes.length - 1 ? etiquette : ""}
          </span>
        ))}
      </div>

      <TableauValeurs
        titre={titre}
        libelleCategorie={g.jour}
        colonnes={[{ cle: "taux", nom: g.tauxValeur }]}
        lignes={etiquettesLongues.map((etiquette, rang) => ({ etiquette, valeurs: [formater(taux[rang] ?? null)] }))}
      />
    </figure>
  );
}
