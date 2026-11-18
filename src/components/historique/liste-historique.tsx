import Link from "next/link";
import { ArrowUpRight, History, RotateCcw } from "lucide-react";
import { CHEMIN_HISTORIQUE, FUSEAU_HORAIRE } from "@/lib/constantes";
import { formaterHeure, formaterJour, initiales } from "@/lib/formats";
import { ajouterJours } from "@/lib/metier/compteurs/periodes";
import { jourDansFuseau } from "@/lib/metier/dates";
import { grouperParJour } from "@/lib/metier/historique";
import { TEXTES_HISTORIQUE } from "@/lib/textes/historique";
import { cn } from "@/lib/utils";
import type { EntreeHistorique } from "@/types";
import { STYLES_ACTIONS } from "./styles-actions";

const textes = TEXTES_HISTORIQUE.liste;
const MARQUE_AUTEUR = "\u0000";
const PASTILLE = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-sm font-medium ring-1 ring-inset";

/** Phrase de l'action avec le nom de l'auteur en gras (le texte vient des fichiers de textes). */
function Phrase({ entree }: { entree: EntreeHistorique }) {
  const [avant, apres] = TEXTES_HISTORIQUE.phrase(entree, MARQUE_AUTEUR).split(MARQUE_AUTEUR);
  return (
    <p className="text-base leading-snug text-texte">
      {avant}
      <strong className="font-semibold text-marine">{entree.auteurNom}</strong>
      {apres}
    </p>
  );
}

function Entree({ entree }: { entree: EntreeHistorique }) {
  const { Icone, pastille, bulle } = STYLES_ACTIONS[entree.action];
  const estSupprime = entree.auteurId === null && entree.auteurIdentifiant !== null;
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0 sm:gap-4">
      <time dateTime={entree.creeLe.toISOString()} className="w-12 shrink-0 pt-2 text-end text-sm font-medium tabular-nums text-texte-secondaire">
        {formaterHeure(entree.creeLe)}
      </time>
      <span className={cn("relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-fond", bulle)}>
        <Icone className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 rounded-xl border border-bordure bg-surface p-3.5 shadow-carte transition-shadow duration-150 hover:shadow-survol">
        <Phrase entree={entree} />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className={cn(PASTILLE, pastille)}>
            <Icone className="size-3.5" aria-hidden="true" />
            {TEXTES_HISTORIQUE.actions[entree.action]}
          </span>
          <span className={cn(PASTILLE, "bg-fond text-texte ring-bordure")}>{TEXTES_HISTORIQUE.modules[entree.module]}</span>
          <span className="inline-flex min-w-0 items-center gap-1.5 text-texte-secondaire">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-marine text-xs font-semibold text-white" aria-hidden="true">
              {initiales(entree.auteurNom)}
            </span>
            {entree.auteurIdentifiant && <span className="truncate font-mono">{entree.auteurIdentifiant}</span>}
            {estSupprime && <span>({textes.compteSupprime})</span>}
          </span>
          {entree.lien && (
            <Link
              href={entree.lien}
              aria-label={textes.ouvrirPage(TEXTES_HISTORIQUE.modules[entree.module])}
              className="ms-auto inline-flex min-h-9 items-center gap-1 rounded-md px-2 font-semibold text-primaire transition-colors duration-150 hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire"
            >
              {textes.ouvrir}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function titreJour(jour: string, aujourdhui: string): string {
  if (jour === aujourdhui) return textes.aujourdhui;
  if (jour === ajouterJours(aujourdhui, -1)) return textes.hier;
  return formaterJour(jour);
}

/** Frise des actions, regroupées par jour (heure de Casablanca), la plus récente d'abord. */
export function ListeHistorique({ entrees, aujourdhui }: { entrees: EntreeHistorique[]; aujourdhui: string }) {
  if (entrees.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-bordure-champ bg-surface px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-canevas text-texte-secondaire">
          <History className="size-6" aria-hidden="true" />
        </span>
        <p className="text-base font-semibold text-texte">{textes.vide}</p>
        <p className="text-sm text-texte-secondaire">{textes.videAide}</p>
        <Link href={CHEMIN_HISTORIQUE} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-base font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-10">
          <RotateCcw className="size-4" aria-hidden="true" />
          {TEXTES_HISTORIQUE.filtres.reinitialiser}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {grouperParJour(entrees, (date) => jourDansFuseau(date, FUSEAU_HORAIRE)).map((groupe) => (
        <section key={groupe.jour} aria-labelledby={`jour-${groupe.jour}`} className="flex flex-col gap-3">
          <h3 id={`jour-${groupe.jour}`} className="sticky top-28 z-20 flex items-center gap-3 bg-fond/95 py-1.5 text-sm font-semibold uppercase tracking-wider text-texte-secondaire backdrop-blur">
            <span className="capitalize">{titreJour(groupe.jour, aujourdhui)}</span>
            <span className="h-px flex-1 bg-bordure" aria-hidden="true" />
            <span className="font-medium normal-case tracking-normal tabular-nums">{textes.total(groupe.entrees.length)}</span>
          </h3>
          {/* Trait vertical de la frise, derrière les pastilles d'action. */}
          <ol className="relative before:absolute before:inset-y-2 before:start-[calc(3rem+1.25rem+0.75rem-1px)] before:w-0.5 before:rounded-full before:bg-bordure sm:before:start-[calc(3rem+1.25rem+1rem-1px)]">
            {groupe.entrees.map((entree) => (
              <Entree key={entree.id} entree={entree} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
