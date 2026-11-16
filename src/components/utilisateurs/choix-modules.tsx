"use client";

import { useState } from "react";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MODULES } from "@/lib/constantes";
import type { Module } from "@/lib/metier/droits";
import { TEXTES_UTILISATEURS } from "@/lib/textes/utilisateurs";

const { champs, modules: libelles } = TEXTES_UTILISATEURS;
const CASE =
  "size-5 shrink-0 cursor-pointer rounded accent-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire";

/** Cases des modules autorisés, avec « Tout » qui coche ou décoche l'ensemble. */
export function ChoixModules({ initiaux, erreur }: { initiaux: Module[]; erreur?: string }) {
  const [coches, setCoches] = useState<Module[]>(initiaux);
  const toutCoche = coches.length === MODULES.length;

  const basculer = (module: Module) =>
    setCoches((actuels) => (actuels.includes(module) ? actuels.filter((m) => m !== module) : [...actuels, module]));

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby="aide-modules">
      <legend className="text-base font-semibold text-marine">{champs.modules}</legend>
      <p id="aide-modules" className="text-sm text-texte-secondaire">{champs.aideModules}</p>
      <div className="mt-1 overflow-hidden rounded-lg border border-bordure">
        <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-bordure bg-fond px-4 text-base font-semibold text-texte">
          <input
            type="checkbox"
            className={CASE}
            checked={toutCoche}
            onChange={() => setCoches(toutCoche ? [] : [...MODULES])}
          />
          {champs.tout}
        </label>
        {MODULES.map((module) => (
          <label key={module} className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 text-base text-texte hover:bg-fond">
            <input
              type="checkbox"
              name="modules"
              value={module}
              className={CASE}
              checked={coches.includes(module)}
              onChange={() => basculer(module)}
            />
            <span className="flex flex-col">
              <span className="font-medium">{libelles[module].libelle}</span>
              <span className="text-sm text-texte-secondaire">{libelles[module].detail}</span>
            </span>
          </label>
        ))}
      </div>
      <MessageErreur message={erreur} />
    </fieldset>
  );
}
