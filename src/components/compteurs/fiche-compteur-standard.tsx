"use client";

import { Lock, TriangleAlert } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { Pastille } from "@/components/ui/pastille";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES } from "@/lib/textes/variables-compteurs";
import type { Compteur, FichePackCompteur } from "@/types";
import { useErreurFormule } from "./etat-compteur";
import { ExplicationStandard } from "./explication-standard";
import { VersionsCompteur } from "./versions-compteur";

/**
 * Fiche d'un compteur standard, en lecture seule : il est fixe (ni modifié ni supprimé) ; seul son
 * état actif se change, dans la liste. Une autre règle se crée avec « Nouveau compteur ».
 */
export function FicheCompteurStandard({ compteur, fiche, onFermer }: { compteur: Compteur; fiche: FichePackCompteur; onFermer: () => void }) {
  const erreur = useErreurFormule(compteur);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
        <p className="flex items-start gap-2.5 rounded-lg bg-ciel px-3.5 py-2.5 text-sm text-marine">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {textes.standard.lectureSeule}
        </p>
        {compteur.description && <p className="text-base text-texte">{compteur.description}</p>}
        <div className="flex flex-wrap gap-1.5">
          <Pastille ton="info">{textes.standard.familles[fiche.famille]}</Pastille>
          {compteur.periodicites.map((periodicite) => (
            <Pastille key={periodicite} ton="neutre">{TEXTES_PERIODICITES[periodicite]}</Pastille>
          ))}
          <Pastille ton="neutre">{textes.unitesCourtes[compteur.unite]}</Pastille>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-texte-secondaire">{textes.standard.formule}</span>
          <code className="rounded-md bg-fond px-3 py-2 font-mono text-sm break-all text-texte ring-1 ring-inset ring-bordure">{compteur.formule}</code>
        </div>
        {erreur && (
          <p className="flex items-start gap-2 rounded-lg bg-attention/5 px-3 py-2 text-sm text-attention ring-1 ring-inset ring-attention/25">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {textes.standard.formuleIncomplete(erreur)}
          </p>
        )}
        <ExplicationStandard fiche={fiche} />
        <VersionsCompteur compteurId={compteur.id} versionActuelle={compteur.version} />
      </div>
      <div className="flex shrink-0 justify-end border-t border-bordure bg-fond px-5 py-3 sm:px-6">
        <Bouton variante="contour" onClick={onFermer}>{textes.fermer}</Bouton>
      </div>
    </div>
  );
}
