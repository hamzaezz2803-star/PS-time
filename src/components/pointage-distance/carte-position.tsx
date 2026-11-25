"use client";

import { LoaderCircle, LocateFixed, MapPin, RefreshCw, TriangleAlert } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { adresseCarteIntegree } from "@/lib/metier/pointage-distance";
import { TEXTES_POINTAGE_DISTANCE } from "@/lib/textes/pointage-distance";
import type { EtatPosition } from "./utiliser-position";

const textes = TEXTES_POINTAGE_DISTANCE.position;

const MESSAGES_ECHEC = { refusee: textes.refusee, indisponible: textes.indisponible, nonPrise: textes.nonPrise } as const;

/**
 * Carte OpenStreetMap centrée sur la position détectée, avec un repère fixe. La carte ne réagit
 * pas au toucher ni à la souris : l'employé voit où il est, sans pouvoir choisir un autre lieu.
 */
export function CartePosition({ etat, onActualiser }: { etat: EtatPosition; onActualiser: () => void }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-bordure bg-surface p-5 shadow-carte" aria-labelledby="titre-position">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="titre-position" className="flex items-center gap-2 text-lg font-semibold text-marine">
            <MapPin className="size-5 text-primaire" aria-hidden="true" />
            {textes.titre}
          </h2>
          <p className="text-sm text-texte-secondaire">{textes.aide}</p>
        </div>
        <Bouton variante="fantome" onClick={onActualiser} disabled={etat.etat === "recherche" || etat.etat === "nonPrise"} aria-label={textes.actualiser} title={textes.actualiser}>
          <RefreshCw className="size-5" aria-hidden="true" />
        </Bouton>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-bordure bg-canevas sm:aspect-video" aria-live="polite">
        {etat.etat === "trouvee" ? (
          <iframe
            key={`${etat.position.latitude},${etat.position.longitude}`}
            src={adresseCarteIntegree(etat.position.latitude, etat.position.longitude)}
            title={textes.titreCarte}
            loading="lazy"
            referrerPolicy="no-referrer"
            tabIndex={-1}
            className="pointer-events-none size-full border-0"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
            {etat.etat === "recherche" ? (
              <>
                <LoaderCircle className="size-8 animate-spin text-primaire motion-reduce:animate-none" aria-hidden="true" />
                <p className="text-base text-texte">{textes.recherche}</p>
              </>
            ) : (
              <>
                <TriangleAlert className="size-8 text-erreur" aria-hidden="true" />
                <p role="alert" className="text-base text-texte">{MESSAGES_ECHEC[etat.etat]}</p>
              </>
            )}
          </div>
        )}
      </div>

      {etat.etat === "trouvee" && (
        <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-texte-secondaire">
          <span className="inline-flex items-center gap-1.5 font-medium text-succes">
            <LocateFixed className="size-4" aria-hidden="true" />
            {textes.precision(etat.position.precisionMetres)}
          </span>
          <span>{textes.source}</span>
        </p>
      )}
    </section>
  );
}
