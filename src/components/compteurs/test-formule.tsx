"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { formaterValeur, type UniteCompteur } from "@/lib/metier/compteurs/format";
import type { Periodicite } from "@/lib/metier/compteurs/periodes";
import { variablesPour } from "@/lib/metier/compteurs/variables";
import { calculerFormule, compilerFormule } from "@/lib/metier/formules/formule";
import { TEXTES_COMPTEURS } from "@/lib/textes/compteurs";
import { messageErreurFormule } from "@/lib/textes/formules";
import { TEXTES_PERIODICITES, TEXTES_VARIABLES } from "@/lib/textes/variables-compteurs";
import { cn } from "@/lib/utils";
import { useCodesEvenements } from "./contexte-codes";

const textes = TEXTES_COMPTEURS.test;

/** Champ vide ou illisible = donnée manquante (null), jamais 0. */
const lireNombre = (saisie: string | undefined): number | null => {
  if (saisie === undefined || saisie.trim() === "") return null;
  const nombre = Number(saisie.replace(",", "."));
  return Number.isFinite(nombre) ? nombre : null;
};

/** Essai de la formule avec des valeurs saisies, calculé directement dans le navigateur. */
export function TestFormule({ formule, periodicites, unite }: { formule: string; periodicites: readonly Periodicite[]; unite: UniteCompteur }) {
  const [choisie, setChoisie] = useState<Periodicite | null>(null);
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const periodicite = choisie && periodicites.includes(choisie) ? choisie : (periodicites[0] ?? null);
  const { codes } = useCodesEvenements();

  const compilation = periodicite ? compilerFormule(formule, variablesPour(periodicite, codes)) : null;
  const resultat = compilation?.ok
    ? calculerFormule(compilation.formule, Object.fromEntries(compilation.formule.variables.map((nom) => [nom, lireNombre(saisies[nom])])))
    : null;

  return (
    <details className="group rounded-lg border border-bordure bg-surface">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-base font-medium text-marine focus-visible:outline-2 focus-visible:outline-primaire">
        <FlaskConical className="size-4 text-primaire" aria-hidden="true" />
        {textes.titre}
      </summary>
      <div className="flex flex-col gap-3 border-t border-bordure p-3.5">
        {periodicites.length > 1 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={textes.periodicite}>
            <span className="text-sm text-texte-secondaire">{textes.periodicite}</span>
            {periodicites.map((valeur) => (
              <button
                key={valeur}
                type="button"
                aria-pressed={valeur === periodicite}
                onClick={() => setChoisie(valeur)}
                className={cn("min-h-11 rounded-md border px-3 text-sm font-medium lg:min-h-9", valeur === periodicite ? "border-primaire bg-ciel text-marine" : "border-bordure text-texte-secondaire hover:bg-fond")}
              >
                {TEXTES_PERIODICITES[valeur]}
              </button>
            ))}
          </div>
        )}
        {!compilation?.ok ? (
          <p className="text-sm text-texte-secondaire">{textes.formuleInvalide}</p>
        ) : compilation.formule.variables.length === 0 ? (
          <p className="text-sm text-texte-secondaire">{textes.aucuneVariable}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {compilation.formule.variables.map((nom) => (
              <label key={nom} className="flex flex-col gap-1 text-sm">
                <span className="font-mono text-primaire">{nom}</span>
                <span className="text-texte-secondaire">{TEXTES_VARIABLES[nom as keyof typeof TEXTES_VARIABLES]?.libelle}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={saisies[nom] ?? ""}
                  onChange={(evenement) => setSaisies((actuelles) => ({ ...actuelles, [nom]: evenement.target.value }))}
                  className="h-11 rounded-lg border border-bordure-champ bg-surface px-3 text-base tabular-nums focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:h-10"
                />
              </label>
            ))}
          </div>
        )}
        {resultat && (
          <p aria-live="polite" className={cn("rounded-md px-3 py-2 text-base", resultat.ok ? "bg-ciel text-marine" : "bg-erreur/5 text-erreur")}>
            <span className="font-medium">{textes.resultat} : </span>
            <span className="tabular-nums">{resultat.ok ? formaterValeur(resultat.valeur, unite) : messageErreurFormule(resultat.erreur)}</span>
          </p>
        )}
      </div>
    </details>
  );
}
