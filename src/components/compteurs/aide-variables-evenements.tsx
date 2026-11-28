"use client";

import { variableJours, variableMinutes, variablePris, variableSolde } from "@/lib/metier/compteurs/variables-evenements";
import { TEXTES_COMPTEURS } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES, TEXTES_VARIABLES_CODES as textes } from "@/lib/textes/variables-compteurs";
import { useCodesEvenements } from "./contexte-codes";

const BOUTON = "flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-start transition-colors duration-150 hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire";
const TOUTES = (["JOUR", "SEMAINE", "MOIS"] as const).map((periodicite) => TEXTES_PERIODICITES[periodicite]).join(" · ");

/** Variables propres à chaque événement de l'installation (JOURS_, MIN_, et PRIS_, SOLDE_ si soumis aux droits). */
export function VariablesEvenements({ onInserer }: { onInserer: (texte: string) => void }) {
  const { liste } = useCodesEvenements();
  const variables = liste.flatMap(({ code, nom, estSoumisDroits }) => [
    { nom: variableJours(code), ...textes.jours(nom) },
    { nom: variableMinutes(code), ...textes.minutes(nom) },
    ...(estSoumisDroits ? [{ nom: variablePris(code), ...textes.pris(nom) }, { nom: variableSolde(code), ...textes.solde(nom) }] : []),
  ]);

  return (
    <div className="mt-2 border-t border-bordure pt-2">
      <h3 className="px-2.5 py-1 text-sm font-semibold text-marine">{textes.titre}</h3>
      {variables.length === 0 ? (
        <p className="px-2.5 py-1 text-sm text-texte-secondaire">{textes.aucun}</p>
      ) : (
        <ul className="flex flex-col">
          {variables.map((variable) => (
            <li key={variable.nom}>
              <button type="button" onClick={() => onInserer(variable.nom)} aria-label={TEXTES_COMPTEURS.aide.inserer(variable.nom)} className={BOUTON}>
                <span className="font-mono text-sm text-primaire">{variable.nom}</span>
                <span className="text-sm text-texte">{variable.libelle}</span>
                <span className="text-sm text-texte-secondaire">{variable.regle}</span>
                <span className="text-sm text-texte-secondaire">{TOUTES}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
