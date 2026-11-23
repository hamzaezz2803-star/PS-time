"use client";

import { useState } from "react";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MODULES } from "@/lib/constantes";
import { PAGES_PROPOSEES, pagesProposees, type Module, type Page } from "@/lib/metier/droits";
import { TEXTES_UTILISATEURS } from "@/lib/textes/utilisateurs";

const { champs, modules: libellesModules, pages: libellesPages } = TEXTES_UTILISATEURS;
const CASE =
  "size-5 shrink-0 cursor-pointer rounded accent-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire";

/** Case « tout » d'un ensemble : cochée si tout est coché, à moitié (tiret) si une partie l'est. */
function CaseEnsemble({ coches, total, onChange }: { coches: number; total: number; onChange: () => void }) {
  return (
    <input
      type="checkbox"
      className={CASE}
      checked={coches === total}
      ref={(element) => {
        if (element) element.indeterminate = coches > 0 && coches < total;
      }}
      onChange={onChange}
    />
  );
}

function BlocModule({ module, coches, basculer, fixer }: {
  module: Module;
  coches: Page[];
  basculer: (page: Page) => void;
  fixer: (pages: readonly Page[], estCoche: boolean) => void;
}) {
  const pages = pagesProposees(module);
  const nombre = pages.filter((page) => coches.includes(page)).length;
  return (
    <div className="border-t border-bordure first:border-t-0">
      <label className="flex min-h-12 cursor-pointer items-center gap-3 bg-fond px-4 text-base font-semibold text-texte">
        <CaseEnsemble coches={nombre} total={pages.length} onChange={() => fixer(pages, nombre < pages.length)} />
        <span className="flex-1">{champs.toutLeModule(libellesModules[module])}</span>
        <span className="text-sm font-medium tabular-nums text-texte-secondaire">{champs.compteModule(nombre, pages.length)}</span>
      </label>
      <div className="grid sm:grid-cols-2">
        {pages.map((page) => (
          <label key={page} className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 text-base text-texte hover:bg-fond">
            <input
              type="checkbox"
              name="pages"
              value={page}
              className={CASE}
              checked={coches.includes(page)}
              onChange={() => basculer(page)}
            />
            <span className="flex flex-col">
              <span className="font-medium">{libellesPages[page].libelle}</span>
              <span className="text-sm text-texte-secondaire">{libellesPages[page].detail}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** Autorisations détaillées : une case par page, regroupées par module, avec « Tout » et « Tout le module ». */
export function ChoixPages({ initiales, erreur }: { initiales: Page[]; erreur?: string }) {
  const [coches, setCoches] = useState<Page[]>(initiales);
  const nombreCoches = PAGES_PROPOSEES.filter((page) => coches.includes(page)).length;

  const basculer = (page: Page) =>
    setCoches((actuelles) => (actuelles.includes(page) ? actuelles.filter((p) => p !== page) : [...actuelles, page]));
  const fixer = (pages: readonly Page[], estCoche: boolean) =>
    setCoches((actuelles) => (estCoche ? [...new Set([...actuelles, ...pages])] : actuelles.filter((p) => !pages.includes(p))));

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby="aide-pages">
      <legend className="text-base font-semibold text-marine">{champs.pages}</legend>
      <p id="aide-pages" className="text-sm text-texte-secondaire">{champs.aidePages}</p>
      <div className="mt-1 overflow-hidden rounded-lg border border-bordure">
        <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b-2 border-bordure px-4 text-base font-semibold text-texte">
          <CaseEnsemble coches={nombreCoches} total={PAGES_PROPOSEES.length} onChange={() => fixer(PAGES_PROPOSEES, nombreCoches < PAGES_PROPOSEES.length)} />
          {champs.tout}
        </label>
        {MODULES.map((module) => (
          <BlocModule key={module} module={module} coches={coches} basculer={basculer} fixer={fixer} />
        ))}
      </div>
      <MessageErreur message={erreur} />
    </fieldset>
  );
}
