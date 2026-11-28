"use client";

import { useState } from "react";
import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PRIORITE_EVENEMENT_MAX } from "@/lib/constantes";
import { niveauPriorite } from "@/lib/metier/evenements";
import { TEXTES_EVENEMENTS as textes } from "@/lib/textes/evenements";

const { champs, niveauxPriorite } = textes;

/** Valeur ramenée entre 0 et le maximum (saisie vide ou hors bornes). */
const borner = (valeur: number) => (Number.isFinite(valeur) ? Math.min(PRIORITE_EVENEMENT_MAX, Math.max(0, Math.round(valeur))) : 0);

/**
 * Priorité d'un événement : curseur sur une bande du vert (basse) au rouge (haute), avec la valeur
 * et son niveau écrits à côté (jamais la couleur seule). Le curseur seul est envoyé (« priorite »).
 */
export function JaugePriorite({ valeurInitiale, erreur }: { valeurInitiale: number; erreur?: string }) {
  const [valeur, setValeur] = useState(() => borner(valeurInitiale));
  const niveau = niveauxPriorite[niveauPriorite(valeur)];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Etiquette htmlFor="priorite">{champs.priorite}</Etiquette>
        <span className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={PRIORITE_EVENEMENT_MAX}
            value={valeur}
            onChange={(evenement) => setValeur(borner(evenement.target.valueAsNumber))}
            aria-label={champs.valeurPriorite}
            className="h-10 w-20 rounded-lg border border-bordure-champ bg-surface px-2 text-center text-base tabular-nums text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire"
          />
          <span className="w-16 text-sm font-medium text-texte">{niveau}</span>
        </span>
      </div>
      <div className="relative flex h-11 items-center">
        <div className="bande-priorite absolute inset-x-0 h-3 rounded-md" aria-hidden="true" />
        <input
          type="range"
          id="priorite"
          name="priorite"
          min={0}
          max={PRIORITE_EVENEMENT_MAX}
          step={1}
          value={valeur}
          onChange={(evenement) => setValeur(borner(evenement.target.valueAsNumber))}
          aria-valuetext={`${valeur}, ${niveau}`}
          aria-invalid={erreur ? true : undefined}
          className="jauge-priorite relative h-11 w-full"
        />
      </div>
      <div className="flex justify-between text-sm text-texte-secondaire" aria-hidden="true">
        <span>0 · {niveauxPriorite.basse}</span>
        <span>{PRIORITE_EVENEMENT_MAX} · {niveauxPriorite.haute}</span>
      </div>
      <MessageErreur message={erreur} />
    </div>
  );
}

/** Repère compact pour la liste : petite bande colorée, marque à la valeur, puis valeur et niveau en texte. */
export function ReperePriorite({ valeur }: { valeur: number }) {
  const position = (borner(valeur) / PRIORITE_EVENEMENT_MAX) * 100;
  return (
    <span className="flex items-center gap-2">
      <span className="bande-priorite relative h-2 w-16 rounded-sm" aria-hidden="true">
        <span className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-sm bg-marine ring-2 ring-surface" style={{ left: `${position}%` }} />
      </span>
      <span className="text-sm tabular-nums text-texte">
        {valeur} · {niveauxPriorite[niveauPriorite(valeur)]}
      </span>
    </span>
  );
}
