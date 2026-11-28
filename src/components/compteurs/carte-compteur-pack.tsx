"use client";

import { ChevronDown, Pencil, TriangleAlert } from "lucide-react";
import { changerEtatCompteur } from "@/app/(connecte)/presence/compteurs/actions";
import { Bouton } from "@/components/ui/bouton";
import { Interrupteur } from "@/components/ui/interrupteur";
import { Pastille } from "@/components/ui/pastille";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES } from "@/lib/textes/variables-compteurs";
import { cn } from "@/lib/utils";
import type { Compteur, FichePackCompteur } from "@/types";
import { ExplicationPack } from "./explication-pack";

/** État d'un compteur : interrupteur, ou étiquette « À adapter » tant que sa formule attend des données manquantes. */
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

/** Carte d'un compteur du pack : numéro, libellé, état, formule, explication dépliable, bouton Modifier. */
export function CarteCompteurPack({ compteur, pack, onModifier }: { compteur: Compteur; pack: FichePackCompteur; onModifier: () => void }) {
  const idTitre = `compteur-pack-${pack.numero}`;
  return (
    <article
      aria-labelledby={idTitre}
      className={cn("flex flex-col rounded-xl border bg-surface shadow-carte", compteur.estActif ? "border-succes/40" : "border-bordure")}
    >
      <header className="flex items-start gap-3 p-4 pb-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ciel font-mono text-sm font-semibold tabular-nums text-marine" aria-hidden="true">
          {String(pack.numero).padStart(2, "0")}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 id={idTitre} className="text-base font-semibold text-marine">
            <span className="sr-only">{textes.pack.numero(pack.numero)} : </span>
            {compteur.nom}
          </h3>
          <span className="truncate font-mono text-sm text-texte-secondaire">{compteur.code}</span>
        </div>
        <div className="shrink-0">
          <EtatCompteur compteur={compteur} />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4">
        {compteur.description && <p className="text-base text-texte">{compteur.description}</p>}
        <div className="flex flex-wrap gap-1.5">
          {compteur.periodicites.map((periodicite) => (
            <Pastille key={periodicite} ton="neutre">{TEXTES_PERIODICITES[periodicite]}</Pastille>
          ))}
          <Pastille ton="info">{textes.unitesCourtes[compteur.unite]}</Pastille>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-texte-secondaire">{textes.pack.formule}</span>
          <code className="rounded-md bg-fond px-3 py-2 font-mono text-sm break-all text-texte ring-1 ring-inset ring-bordure">{compteur.formule}</code>
        </div>
        {compteur.estAAdapter && (
          <p className="flex items-start gap-2 rounded-lg bg-attention/5 px-3 py-2 text-sm text-attention ring-1 ring-inset ring-attention/25">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {textes.pack.aideAAdapter}
          </p>
        )}
      </div>

      <details className="group mt-3 border-t border-bordure">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium text-primaire hover:bg-fond focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primaire [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-4 shrink-0 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
          {textes.pack.explication}
        </summary>
        <div className="px-4 pt-1 pb-4">
          <ExplicationPack pack={pack} />
        </div>
      </details>

      <footer className="flex justify-end border-t border-bordure px-4 py-3">
        <Bouton variante="contour" onClick={onModifier} aria-label={textes.modifier(compteur.nom)}>
          <Pencil className="size-4" aria-hidden="true" />
          {textes.pack.modifier}
        </Bouton>
      </footer>
    </article>
  );
}
