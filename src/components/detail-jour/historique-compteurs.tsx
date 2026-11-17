"use client";

import { History } from "lucide-react";
import { DUREES_HISTORIQUE } from "@/lib/constantes";
import { formaterJour } from "@/lib/formats";
import { formaterValeur } from "@/lib/metier/compteurs/format";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import { cn } from "@/lib/utils";
import type { Compteur, DetailJour } from "@/types";
import { Carte } from "./cartes-jour";
import { useNavigationDetail } from "./navigation-detail";

const textes = TEXTES_DETAIL_JOUR.historique;

/** Résumé d'une colonne : somme des valeurs connues (moyenne pour un pourcentage), ou rien. */
function resume(compteur: Compteur, valeurs: (number | null)[]): string {
  const connues = valeurs.filter((valeur): valeur is number => valeur !== null);
  if (connues.length === 0) return "";
  const somme = connues.reduce((total, valeur) => total + valeur, 0);
  return formaterValeur(compteur.unite === "pourcentage" ? somme / connues.length : somme, compteur.unite);
}

/** Tableau jour × compteur journalier (le plus récent en haut), avec une barre proportionnelle dans chaque case. */
export function HistoriqueCompteurs({ detail }: { detail: DetailJour }) {
  const { selection, naviguer } = useNavigationDetail();
  const journaliers = detail.compteurs.filter((compteur) => compteur.periodicites.includes("JOUR"));
  const lignes = [...detail.historique].reverse();
  const colonne = (id: string) => detail.historique.map((jour) => jour.valeurs.find((valeur) => valeur.idCompteur === id)?.valeur ?? null);
  const maximums = new Map(journaliers.map((compteur) => [compteur.id, Math.max(1, ...colonne(compteur.id).map((valeur) => Math.abs(valeur ?? 0)))]));

  const choixDuree = (
    <div role="group" aria-label={textes.duree} className="flex gap-1 rounded-lg bg-canevas p-1">
      {DUREES_HISTORIQUE.map((duree) => (
        <button
          key={duree}
          type="button"
          aria-pressed={selection.jours === duree}
          onClick={() => naviguer({ jours: duree })}
          className={cn("min-h-11 rounded-md px-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-8", selection.jours === duree ? "bg-surface text-marine shadow-carte ring-1 ring-bordure" : "text-texte-secondaire hover:text-texte")}
        >
          {textes.jours(duree)}
        </button>
      ))}
    </div>
  );

  return (
    <Carte titre={textes.titre} Icone={History} action={journaliers.length > 0 ? choixDuree : undefined}>
      {journaliers.length === 0 ? (
        <p className="text-base text-texte-secondaire">{textes.aucun}</p>
      ) : (
        <div className="-m-4 overflow-x-auto sm:-m-5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-bordure bg-fond/70 text-texte-secondaire">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">{textes.colonneJour}</th>
                {journaliers.map((compteur) => (
                  <th key={compteur.id} scope="col" className="min-w-36 px-4 py-2.5 font-semibold">{compteur.nom}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure">
              {lignes.map((jour) => {
                const estAffiche = jour.jour === detail.date;
                return (
                  <tr key={jour.jour} className={cn("transition-colors duration-150 hover:bg-fond", estAffiche && "bg-ciel/60 hover:bg-ciel")} aria-current={estAffiche ? "date" : undefined}>
                    <th scope="row" className="px-4 py-1.5 font-normal">
                      <button
                        type="button"
                        onClick={() => naviguer({ date: jour.jour })}
                        aria-label={estAffiche ? `${formaterJour(jour.jour)}, ${textes.jourAffiche}` : textes.afficherJour(formaterJour(jour.jour))}
                        className="min-h-11 rounded-md text-start font-medium text-texte tabular-nums hover:text-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9"
                      >
                        {formaterJour(jour.jour)}
                      </button>
                    </th>
                    {journaliers.map((compteur) => {
                      const valeur = jour.valeurs.find((element) => element.idCompteur === compteur.id);
                      const nombre = valeur?.valeur ?? null;
                      return (
                        <td key={compteur.id} className="px-4 py-1.5" title={valeur?.message ?? undefined}>
                          <span className="flex items-center gap-2">
                            <span className="w-16 shrink-0 tabular-nums text-texte">{nombre === null ? <span className="text-texte-secondaire">{TEXTES_DETAIL_JOUR.compteurs.sansValeur}</span> : formaterValeur(nombre, compteur.unite)}</span>
                            {nombre !== null && (
                              <span className="h-2 flex-1 overflow-hidden rounded-sm bg-fond" aria-hidden="true">
                                <span className="block h-full rounded-sm bg-primaire/60" style={{ width: `${(Math.abs(nombre) / (maximums.get(compteur.id) ?? 1)) * 100}%` }} />
                              </span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-bordure bg-fond/70">
              <tr>
                <th scope="row" className="px-4 py-2.5 text-start font-semibold text-texte">{textes.total}</th>
                {journaliers.map((compteur) => (
                  <td key={compteur.id} className="px-4 py-2.5 font-semibold text-marine tabular-nums">{resume(compteur, colonne(compteur.id))}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Carte>
  );
}
