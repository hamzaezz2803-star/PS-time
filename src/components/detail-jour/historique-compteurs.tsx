"use client";

import { History } from "lucide-react";
import { DUREES_HISTORIQUE } from "@/lib/constantes";
import { formaterJour, formaterJourEnDeux } from "@/lib/formats";
import { formaterValeur } from "@/lib/metier/compteurs/format";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import { cn } from "@/lib/utils";
import type { Compteur, DetailJour } from "@/types";
import { Carte } from "./cartes-jour";
import { EvenementJour, HoraireJour, PresenceJour } from "./elements-jour";
import { useNavigationDetail } from "./navigation-detail";

const textes = TEXTES_DETAIL_JOUR.historique;
const colonnesJour = TEXTES_DETAIL_JOUR.jour;
const CELLULE = "px-3 py-2 align-middle";

/** Résumé d'une colonne : somme des valeurs connues (moyenne pour un pourcentage), ou rien. */
function resume(compteur: Compteur, valeurs: (number | null)[]): string {
  const connues = valeurs.filter((valeur): valeur is number => valeur !== null);
  if (connues.length === 0) return "";
  const somme = connues.reduce((total, valeur) => total + valeur, 0);
  return formaterValeur(compteur.unite === "pourcentage" ? somme / connues.length : somme, compteur.unite);
}

/**
 * Historique jour par jour (le plus récent en haut) : horaire, entrée et sortie, événement retenu
 * (et non validés), puis chaque compteur journalier avec une barre proportionnelle. Les jours de
 * repos sont grisés ; la colonne du jour reste visible pendant le défilement horizontal.
 */
export function HistoriqueCompteurs({ detail }: { detail: DetailJour }) {
  const { selection, naviguer } = useNavigationDetail();
  const journaliers = detail.compteurs.filter((compteur) => compteur.periodicites.includes("JOUR"));
  const historique = detail.jours.filter((jour) => jour.jour >= detail.debutHistorique && jour.jour <= detail.date);
  const lignes = [...historique].reverse();
  const colonne = (id: string) => historique.map((jour) => jour.valeurs.find((valeur) => valeur.idCompteur === id)?.valeur ?? null);
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
    <Carte titre={textes.titre} Icone={History} action={choixDuree}>
      <p className="-mt-1 mb-3 text-sm text-texte-secondaire">{textes.legende}</p>
      {journaliers.length === 0 && <p className="mb-3 text-sm text-texte-secondaire">{textes.aucun}</p>}
      <div className="relative -mx-4 -mb-4 overflow-x-auto border-t border-bordure sm:-mx-5 sm:-mb-5">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{textes.titre}</caption>
            <thead className="border-b border-bordure bg-fond text-sm text-texte-secondaire">
              <tr>
                <th scope="col" className="sticky start-0 z-10 bg-fond px-4 py-3 font-semibold">{textes.colonneJour}</th>
                <th scope="col" className={`${CELLULE} py-3 font-semibold`}>{colonnesJour.horaire}</th>
                <th scope="col" className={`${CELLULE} py-3 font-semibold`}>{colonnesJour.presence}</th>
                <th scope="col" className={`${CELLULE} min-w-40 py-3 font-semibold`}>{colonnesJour.evenement}</th>
                {journaliers.map((compteur) => (
                  <th key={compteur.id} scope="col" className={`${CELLULE} min-w-32 py-3 font-semibold`}>{compteur.nom}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure">
              {lignes.map((jour) => {
                const estAffiche = jour.jour === detail.date;
                const estRepos = jour.profilCode === null;
                const fondLigne = estAffiche ? "bg-ciel" : estRepos ? "bg-fond" : "bg-surface";
                return (
                  <tr
                    key={jour.jour}
                    className={cn("group transition-colors duration-150", fondLigne, !estAffiche && "hover:bg-canevas", estRepos && !estAffiche && "text-texte-secondaire")}
                    aria-current={estAffiche ? "date" : undefined}
                  >
                    <th
                      scope="row"
                      className={cn(
                        "sticky start-0 z-10 px-4 py-2 font-normal shadow-[1px_0_0_var(--color-bordure)] transition-colors duration-150",
                        fondLigne,
                        estAffiche && "shadow-[inset_3px_0_0_var(--color-primaire),1px_0_0_var(--color-bordure)]",
                        !estAffiche && "group-hover:bg-canevas",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => naviguer({ date: jour.jour })}
                        aria-label={estAffiche ? `${formaterJour(jour.jour)}, ${textes.jourAffiche}` : textes.afficherJour(formaterJour(jour.jour))}
                        className="flex min-h-11 flex-col items-start justify-center rounded-md text-start focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-10"
                      >
                        <span className="text-sm capitalize text-texte-secondaire">{formaterJourEnDeux(jour.jour).semaine}</span>
                        <span className={cn("whitespace-nowrap font-semibold tabular-nums group-hover:text-primaire", estAffiche ? "text-marine" : "text-texte")}>
                          {formaterJourEnDeux(jour.jour).date}
                        </span>
                      </button>
                    </th>
                    <td className={CELLULE}><HoraireJour jour={jour} /></td>
                    <td className={CELLULE}><PresenceJour jour={jour} /></td>
                    <td className={CELLULE}><EvenementJour jour={jour} /></td>
                    {journaliers.map((compteur) => {
                      const valeur = jour.valeurs.find((element) => element.idCompteur === compteur.id);
                      const nombre = valeur?.valeur ?? null;
                      return (
                        <td key={compteur.id} className={CELLULE} title={valeur?.message ?? undefined}>
                          {nombre === null ? (
                            <span className="text-texte-secondaire">
                              <span aria-hidden="true">-</span>
                              <span className="sr-only">{TEXTES_DETAIL_JOUR.compteurs.sansValeur}</span>
                            </span>
                          ) : (
                            <span className="flex flex-col gap-1">
                              <span className="whitespace-nowrap font-medium text-texte tabular-nums">{formaterValeur(nombre, compteur.unite)}</span>
                              <span className="h-1.5 w-full max-w-28 overflow-hidden rounded-sm bg-canevas" aria-hidden="true">
                                <span className="block h-full rounded-sm bg-primaire" style={{ width: `${(Math.abs(nombre) / (maximums.get(compteur.id) ?? 1)) * 100}%` }} />
                              </span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            {journaliers.length > 0 && (
              <tfoot className="border-t-2 border-bordure bg-fond">
                <tr>
                  <th scope="row" colSpan={4} className="px-4 py-2.5 text-start font-semibold text-texte">{textes.total}</th>
                  {journaliers.map((compteur) => (
                    <td key={compteur.id} className={`${CELLULE} py-2.5 font-semibold text-marine tabular-nums`}>{resume(compteur, colonne(compteur.id))}</td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
      </div>
    </Carte>
  );
}
