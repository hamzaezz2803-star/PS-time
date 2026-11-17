"use client";

import { useState } from "react";
import { ListeOnglets, PanneauOnglet } from "@/components/ui/onglets";
import type { Periodicite } from "@/lib/metier/compteurs/periodes";
import { VARIABLES_COMPTEURS } from "@/lib/metier/compteurs/variables";
import { TEXTES_COMPTEURS } from "@/lib/textes/compteurs";
import { AIDE_FONCTIONS, AIDE_OPERATEURS } from "@/lib/textes/formules";
import { TEXTES_PERIODICITES, TEXTES_VARIABLES } from "@/lib/textes/variables-compteurs";
import { cn } from "@/lib/utils";

const textes = TEXTES_COMPTEURS.aide;
const BASE = "aide-formule";
const BOUTON = "flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-start transition-colors duration-150 hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire";

/** Aide de l'éditeur : variables, fonctions et opérateurs ; un clic insère l'élément dans la formule. */
export function AideFormule({ periodicites, onInserer }: { periodicites: readonly Periodicite[]; onInserer: (texte: string) => void }) {
  const [onglet, setOnglet] = useState("variables");
  const onglets = [
    { id: "variables", libelle: textes.variables },
    { id: "fonctions", libelle: textes.fonctions },
    { id: "operateurs", libelle: textes.operateurs },
  ];

  return (
    <section aria-label={textes.titre} className="flex min-h-0 flex-col rounded-lg border border-bordure bg-fond/60 p-2">
      <ListeOnglets base={BASE} onglets={onglets} actif={onglet} onChanger={setOnglet} libelle={textes.titre} />
      <div className="max-h-80 overflow-y-auto lg:max-h-[26rem]">
        <PanneauOnglet base={BASE} id="variables" actif={onglet}>
          <ul className="-mt-3 flex flex-col">
            {VARIABLES_COMPTEURS.map((variable) => {
              const disponibles = variable.periodicites as readonly Periodicite[];
              const estDisponible = periodicites.every((periodicite) => disponibles.includes(periodicite));
              return (
                <li key={variable.nom}>
                  <button type="button" onClick={() => onInserer(variable.nom)} aria-label={textes.inserer(variable.nom)} className={cn(BOUTON, !estDisponible && "opacity-55")}>
                    <span className="font-mono text-sm text-primaire">{variable.nom}</span>
                    <span className="text-sm text-texte">{TEXTES_VARIABLES[variable.nom].libelle}</span>
                    <span className="text-sm text-texte-secondaire">{TEXTES_VARIABLES[variable.nom].regle}</span>
                    <span className="text-sm text-texte-secondaire">
                      {disponibles.map((periodicite) => TEXTES_PERIODICITES[periodicite]).join(" · ")}
                      {!estDisponible && ` · ${textes.indisponible}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </PanneauOnglet>
        <PanneauOnglet base={BASE} id="fonctions" actif={onglet}>
          <ul className="-mt-3 flex flex-col">
            {AIDE_FONCTIONS.map((fonction) => (
              <li key={fonction.nom}>
                <button type="button" onClick={() => onInserer(fonction.insertion)} aria-label={textes.inserer(fonction.nom)} className={BOUTON}>
                  <span className="font-mono text-sm text-marine">{fonction.syntaxe}</span>
                  <span className="text-sm text-texte-secondaire">{fonction.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </PanneauOnglet>
        <PanneauOnglet base={BASE} id="operateurs" actif={onglet}>
          <ul className="-mt-3 grid grid-cols-2 gap-1">
            {AIDE_OPERATEURS.map((operateur) => (
              <li key={operateur.symbole}>
                <button type="button" onClick={() => onInserer(` ${operateur.symbole} `)} aria-label={textes.inserer(operateur.symbole)} className={BOUTON}>
                  <span className="font-mono text-sm text-texte">{operateur.symbole}</span>
                  <span className="text-sm text-texte-secondaire">{operateur.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </PanneauOnglet>
      </div>
    </section>
  );
}
