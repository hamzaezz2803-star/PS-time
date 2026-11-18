"use client";

import { useState } from "react";
import { graduations, hauteurPourcent } from "@/lib/metier/graphiques";
import { formaterDuree } from "@/lib/metier/programme";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";
import { cn } from "@/lib/utils";

const textes = TEXTES_PRESENCE.statistiques.graphiques;
const MINUTES_PAR_HEURE = 60;
/** Au-delà, une étiquette d'axe sur deux (ou plus) est masquée pour éviter les chevauchements. */
const ETIQUETTES_AXE_MAX = 10;

export type SerieGraphique = {
  cle: string;
  nom: string;
  /** Classe de fond de la série (fixe, définie par le composant appelant). */
  couleur: string;
  valeurs: number[];
};

type Proprietes = {
  id: string;
  titre: string;
  aide: string;
  /** Étiquettes courtes de l'axe et longues de l'infobulle et du tableau, une par colonne. */
  etiquettes: string[];
  etiquettesLongues: string[];
  series: SerieGraphique[];
  mode: "empile" | "groupe";
  /** « heures » : valeurs en minutes, affichées en heures. */
  unite: "nombre" | "heures";
  /** En-tête de la première colonne du tableau des valeurs (« Jour », « Heure »). */
  libelleCategorie?: string;
};

/**
 * Colonnes (empilées ou côte à côte), axe gradué, légende, infobulle au survol et au clavier,
 * et tableau des valeurs : rien n'est lisible seulement par la couleur ou le survol.
 */
export function GraphiqueColonnes({ id, titre, aide, etiquettes, etiquettesLongues, series, mode, unite, libelleCategorie = textes.jour }: Proprietes) {
  const [actif, setActif] = useState<number | null>(null);
  const formater = (valeur: number) => (unite === "heures" ? formaterDuree(Math.round(valeur)) : String(valeur));
  const totaux = etiquettes.map((_, rang) => series.reduce((total, serie) => total + (serie.valeurs[rang] ?? 0), 0));
  const maximum = mode === "empile" ? Math.max(0, ...totaux) : Math.max(0, ...series.flatMap((serie) => serie.valeurs));
  const echelle = unite === "heures" ? MINUTES_PAR_HEURE : 1;
  const ticks = graduations(maximum / echelle).map((tick) => tick * echelle);
  const haut = ticks[ticks.length - 1] ?? 1;
  const pasEtiquette = Math.ceil(etiquettes.length / ETIQUETTES_AXE_MAX);
  const resume = (rang: number) =>
    `${etiquettesLongues[rang]} : ${series.map((serie) => `${serie.nom} ${formater(serie.valeurs[rang] ?? 0)}`).join(", ")}`;

  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <figcaption>
        <span id={`${id}-titre`} className="block text-base font-semibold text-marine">{titre}</span>
        <span className="block text-sm text-texte-secondaire">{aide}</span>
      </figcaption>

      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-texte-secondaire" aria-label={titre}>
          {series.map((serie) => (
            <li key={serie.cle} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded-[3px]", serie.couleur)} aria-hidden="true" />
              {serie.nom}
            </li>
          ))}
        </ul>
      )}

      {/* Marge du haut : la graduation la plus haute, centrée sur son trait, ne touche pas la légende. */}
      <div className="relative mt-3 h-52 ps-14" onPointerLeave={() => setActif(null)}>
        {/* Graduations : ligne de hauteur nulle posée sur la valeur, trait et texte centrés dessus. */}
        {ticks.map((tick) => (
          <div key={tick} className="absolute inset-x-0 flex h-0 items-center" style={{ bottom: `${hauteurPourcent(tick, haut)}%` }} aria-hidden="true">
            <span className="w-14 shrink-0 whitespace-nowrap pe-2 text-end text-sm tabular-nums text-texte-secondaire">{unite === "heures" ? `${tick / echelle} h` : tick}</span>
            <span className={cn("h-px flex-1", tick === 0 ? "bg-bordure-champ" : "bg-graphe-grille")} />
          </div>
        ))}
        <div className="absolute inset-y-0 end-0 start-14 flex items-end gap-1">
          {etiquettes.map((etiquette, rang) => (
            <div
              key={`${etiquette}-${rang}`}
              tabIndex={0}
              aria-label={resume(rang)}
              onPointerEnter={() => setActif(rang)}
              onFocus={() => setActif(rang)}
              onBlur={() => setActif(null)}
              className={cn(
                "relative flex h-full min-w-0 flex-1 items-end justify-center rounded-md outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire",
                actif === rang && "bg-canevas/70",
              )}
            >
              {mode === "empile" ? (
                <div className="flex w-full max-w-6 flex-col-reverse gap-[2px] overflow-hidden rounded-t-[4px]" style={{ height: `${hauteurPourcent(totaux[rang] ?? 0, haut)}%` }}>
                  {series.map((serie) =>
                    (serie.valeurs[rang] ?? 0) > 0 ? <span key={serie.cle} className={serie.couleur} style={{ flexGrow: serie.valeurs[rang] }} /> : null,
                  )}
                </div>
              ) : (
                <div className="flex h-full w-full max-w-12 items-end justify-center gap-[2px]">
                  {series.map((serie) => (
                    <span key={serie.cle} className={cn("w-full max-w-4 rounded-t-[4px]", serie.couleur)} style={{ height: `${hauteurPourcent(serie.valeurs[rang] ?? 0, haut)}%` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {actif !== null && (
          <div
            role="presentation"
            className={cn(
              "pointer-events-none absolute top-0 z-10 min-w-40 rounded-lg bg-surface px-3 py-2 text-sm shadow-flottant ring-1 ring-bordure",
              // Près d'un bord, l'infobulle se décale vers l'intérieur pour rester dans la carte.
              (actif + 0.5) / etiquettes.length < 0.25 ? "-translate-x-[15%]" : (actif + 0.5) / etiquettes.length > 0.75 ? "-translate-x-[85%]" : "-translate-x-1/2",
            )}
            style={{ left: `calc(3.5rem + (100% - 3.5rem) * ${(actif + 0.5) / etiquettes.length})` }}
          >
            <p className="mb-1 font-medium text-texte-secondaire">{etiquettesLongues[actif]}</p>
            {series.map((serie) => (
              <p key={serie.cle} className="flex items-center gap-2">
                <span className={cn("h-0.5 w-3 rounded-full", serie.couleur)} aria-hidden="true" />
                <span className="font-semibold tabular-nums text-texte">{formater(serie.valeurs[actif] ?? 0)}</span>
                <span className="text-texte-secondaire">{serie.nom}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1 ps-14 text-sm text-texte-secondaire" aria-hidden="true">
        {etiquettes.map((etiquette, rang) => (
          <span key={`${etiquette}-${rang}`} className="min-w-0 flex-1 truncate text-center">
            {rang % pasEtiquette === 0 || rang === etiquettes.length - 1 ? etiquette : ""}
          </span>
        ))}
      </div>

      <details className="text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-1 font-medium text-primaire hover:underline focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9">
          {textes.voirValeurs}
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-bordure">
          <table className="w-full text-start text-sm">
            <caption className="sr-only">{titre}</caption>
            <thead className="bg-fond text-texte-secondaire">
              <tr>
                <th scope="col" className="px-3 py-2 text-start font-medium">{libelleCategorie}</th>
                {series.map((serie) => (
                  <th key={serie.cle} scope="col" className="px-3 py-2 text-end font-medium">{serie.nom}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {etiquettesLongues.map((etiquette, rang) => (
                <tr key={`${etiquette}-${rang}`} className="border-t border-bordure">
                  <th scope="row" className="px-3 py-1.5 text-start font-normal capitalize text-texte">{etiquette}</th>
                  {series.map((serie) => (
                    <td key={serie.cle} className="px-3 py-1.5 text-end tabular-nums text-texte">{formater(serie.valeurs[rang] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
