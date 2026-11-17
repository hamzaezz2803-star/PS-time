"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CircleHelp, Clock, RotateCw, SearchX } from "lucide-react";
import { ChampRecherche } from "@/components/ui/champ-recherche";
import { Pastille } from "@/components/ui/pastille";
import { RAPPORT_LIGNES_MAX } from "@/lib/constantes";
import { formaterJour } from "@/lib/formats";
import { minutesVersHeure } from "@/lib/metier/programme";
import { correspondARecherche } from "@/lib/metier/recherche";
import { TEXTES_RAPPORT } from "@/lib/textes/rapport-presences";
import { cn } from "@/lib/utils";
import type { LigneRapportPresence } from "@/types";

const textes = TEXTES_RAPPORT.tableau;

/** Tableau du rapport : filtre immédiat par nom ou matricule, actualisation, horaire reconnu en pastille. */
export function TableauRapport({ lignes, estTronque }: { lignes: LigneRapportPresence[]; estTronque: boolean }) {
  const routeur = useRouter();
  const [enCours, demarrer] = useTransition();
  const [filtre, setFiltre] = useState("");
  const visibles = lignes.filter((ligne) => correspondARecherche(`${ligne.nomComplet} ${ligne.matricule}`, filtre));

  return (
    <section aria-labelledby="titre-rapport" aria-busy={enCours} className="overflow-hidden rounded-xl border border-bordure bg-surface shadow-carte">
      <div className="flex flex-wrap items-center gap-3 border-b border-bordure px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Clock className="size-5 shrink-0 text-primaire" aria-hidden="true" />
          <h2 id="titre-rapport" className="text-base font-semibold text-marine">{textes.titre}</h2>
          <span className="rounded-md bg-ciel px-2 py-0.5 text-sm font-medium tabular-nums text-marine" aria-live="polite">{textes.total(visibles.length)}</span>
        </div>
        {lignes.length > 0 && (
          <ChampRecherche id="filtre-rapport" libelle={TEXTES_RAPPORT.filtres.filtrer} valeur={filtre} onChange={setFiltre} placeholder={TEXTES_RAPPORT.filtres.exempleFiltre} className="w-full sm:w-64" />
        )}
        <button
          type="button"
          onClick={() => demarrer(() => routeur.refresh())}
          disabled={enCours}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-bordure-champ bg-surface px-3.5 text-sm font-semibold text-texte shadow-carte hover:bg-fond focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire disabled:opacity-60 sm:w-fit lg:min-h-10"
        >
          <RotateCw className={cn("size-4", enCours && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
          {textes.actualiser}
        </button>
      </div>

      {estTronque && <p className="border-b border-bordure bg-attention/5 px-5 py-2.5 text-sm text-texte">{textes.tropDeLignes(RAPPORT_LIGNES_MAX)}</p>}

      {lignes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire ring-8 ring-ciel/40">
            <CalendarClock className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-1 text-base font-semibold text-texte">{textes.vide}</p>
          <p className="max-w-md text-sm text-texte-secondaire">{textes.videAction}</p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <SearchX className="size-6 text-primaire" aria-hidden="true" />
          <p className="text-base font-semibold text-texte">{textes.aucunResultat(filtre.trim())}</p>
        </div>
      ) : (
        <div className={cn("relative overflow-x-auto transition-opacity duration-150", enCours && "opacity-55")}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-bordure bg-fond/70 text-texte-secondaire">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">{textes.matricule}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{textes.employe}</th>
                <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">{textes.departement}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{textes.date}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{textes.premierPointage}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{textes.horaire}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure text-texte">
              {visibles.map((ligne) => (
                <tr key={`${ligne.employeId}-${ligne.jour}`} className="transition-colors duration-150 hover:bg-fond">
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-fond px-2 py-1 font-mono text-sm font-semibold text-marine ring-1 ring-inset ring-bordure">{ligne.matricule}</span>
                  </td>
                  <td className="px-5 py-3 text-base font-medium">{ligne.nomComplet}</td>
                  <td className="hidden px-5 py-3 text-texte-secondaire md:table-cell">{ligne.departement}</td>
                  <td className="whitespace-nowrap px-5 py-3 tabular-nums">{formaterJour(ligne.jour)}</td>
                  <td className="px-5 py-3 font-mono text-base tabular-nums">{minutesVersHeure(ligne.minutes)}</td>
                  <td className="px-5 py-3">
                    {ligne.profil ? (
                      <Pastille Icone={CalendarClock}>
                        <span className="font-mono">{ligne.profil.code}</span> {ligne.profil.nom}
                      </Pastille>
                    ) : (
                      <Pastille Icone={CircleHelp} ton="neutre">{textes.aucunHoraire}</Pastille>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
