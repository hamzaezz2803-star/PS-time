"use client";

import { useState } from "react";
import { ChevronDown, Pencil, TriangleAlert } from "lucide-react";
import { changerEtatCompteur } from "@/app/(connecte)/presence/compteurs/actions";
import { Interrupteur } from "@/components/ui/interrupteur";
import { Pastille } from "@/components/ui/pastille";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES } from "@/lib/textes/variables-compteurs";
import { cn } from "@/lib/utils";
import type { Compteur, FichePackCompteur } from "@/types";
import { ExplicationPack } from "./explication-pack";

/** État d'un compteur : interrupteur, ou étiquette tant que sa formule attend des données que PS Time ne fournit pas. */
export function EtatCompteur({ compteur }: { compteur: Compteur }) {
  if (compteur.estAAdapter) return <Pastille ton="attention" Icone={TriangleAlert}>{textes.pack.aAdapter}</Pastille>;
  return (
    <Interrupteur
      estActif={compteur.estActif}
      basculer={(nouvelEtat) => changerEtatCompteur(compteur.id, nouvelEtat)}
      libelles={{ actif: textes.actif, inactif: textes.inactif, activer: textes.activer(compteur.nom), desactiver: textes.desactiver(compteur.nom) }}
    />
  );
}

const BOUTON_ICONE =
  "flex size-11 shrink-0 items-center justify-center rounded-md text-texte-secondaire transition-colors duration-150 hover:bg-fond hover:text-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:size-9";

/**
 * Ligne compacte d'un compteur du pack : numéro, libellé et résumé, périodicités, état.
 * Le détail (formule, explication) se déplie sous la ligne.
 */
export function LigneCompteurPack({ compteur, pack, onModifier }: { compteur: Compteur; pack: FichePackCompteur; onModifier: () => void }) {
  const [estOuverte, setEstOuverte] = useState(false);
  const idDetail = `detail-compteur-pack-${pack.numero}`;

  return (
    <li className={cn(estOuverte && "bg-fond/60")}>
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <span className="w-8 shrink-0 font-mono text-sm font-semibold tabular-nums text-texte-secondaire" aria-hidden="true">
          {String(pack.numero).padStart(2, "0")}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium text-texte">
            <span className="sr-only">{textes.pack.numero(pack.numero)} : </span>
            {compteur.nom}
          </span>
          {compteur.description && <span className="truncate text-sm text-texte-secondaire">{compteur.description}</span>}
        </div>
        <span className="hidden shrink-0 gap-1 md:flex">
          {compteur.periodicites.map((periodicite) => (
            <Pastille key={periodicite} ton="neutre">{TEXTES_PERIODICITES[periodicite]}</Pastille>
          ))}
        </span>
        <div className="flex shrink-0 justify-start sm:w-52">
          <EtatCompteur compteur={compteur} />
        </div>
        <button
          type="button"
          onClick={() => setEstOuverte(!estOuverte)}
          aria-expanded={estOuverte}
          aria-controls={idDetail}
          aria-label={textes.pack.voirDetail(compteur.nom)}
          className={BOUTON_ICONE}
        >
          <ChevronDown className={cn("size-5 transition-transform duration-150 motion-reduce:transition-none", estOuverte && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      {estOuverte && (
        <div id={idDetail} className="flex flex-col gap-3 px-3 pb-4 sm:ps-15 sm:pe-4">
          {compteur.estAAdapter && (
            <p className="flex items-start gap-2 rounded-lg bg-attention/5 px-3 py-2 text-sm text-attention ring-1 ring-inset ring-attention/25">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {textes.pack.aideAAdapter}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-texte-secondaire">{textes.pack.formule}</span>
            <code className="rounded-md bg-surface px-2 py-1 font-mono text-sm break-all text-texte ring-1 ring-inset ring-bordure">{compteur.formule}</code>
            <span className="font-mono text-sm text-texte-secondaire">{compteur.code}</span>
            <button type="button" onClick={onModifier} className="ms-auto flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9">
              <Pencil className="size-4" aria-hidden="true" />
              {textes.pack.modifier}
            </button>
          </div>
          <ExplicationPack pack={pack} />
        </div>
      )}
    </li>
  );
}
