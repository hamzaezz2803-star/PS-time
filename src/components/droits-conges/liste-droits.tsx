import { CalendarCheck, SearchX } from "lucide-react";
import { FiltresEmployeJour } from "@/components/liste/filtres-employe-jour";
import { PaginationListe } from "@/components/liste/pagination-liste";
import { CHEMIN_DROITS_CONGES } from "@/lib/constantes";
import { chaineRecherche } from "@/lib/metier/recherche";
import { TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import type { RechercheAbsences } from "@/lib/validation/absence";
import type { DroitCongeListe } from "@/types";
import { CarteDroit } from "./carte-droit";

/** Liste paginée des droits aux congés, en cartes (deux colonnes sur grand écran). */
export function ListeDroits({
  droits,
  total,
  page,
  nombrePages,
  recherche,
}: {
  droits: DroitCongeListe[];
  total: number;
  page: number;
  nombrePages: number;
  recherche: RechercheAbsences;
}) {
  const estFiltree = recherche.employe !== "" || recherche.jour !== null;
  const lienPage = (numero: number) => `${CHEMIN_DROITS_CONGES}${chaineRecherche({ employe: recherche.employe, jour: recherche.jour, page: numero })}`;

  return (
    <section className="overflow-hidden rounded-xl border border-bordure bg-surface shadow-carte" aria-labelledby="titre-droits">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-bordure px-4 py-3.5 sm:px-5">
        <h2 id="titre-droits" className="text-base font-semibold text-marine">{textes.titreListe}</h2>
        <span className="rounded-md bg-fond px-2 py-0.5 text-sm font-medium tabular-nums text-texte-secondaire ring-1 ring-inset ring-bordure">{textes.total(total)}</span>
      </div>
      {(total > 0 || estFiltree) && <FiltresEmployeJour chemin={CHEMIN_DROITS_CONGES} recherche={recherche} textes={textes.filtres} />}

      {droits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire">
            {estFiltree ? <SearchX className="size-6" aria-hidden="true" /> : <CalendarCheck className="size-6" aria-hidden="true" />}
          </span>
          <p className="text-base font-semibold text-texte">{estFiltree ? textes.aucunResultat : textes.vide}</p>
          {!estFiltree && <p className="max-w-md text-sm text-texte-secondaire">{textes.videAction}</p>}
        </div>
      ) : (
        <div className="grid gap-4 bg-fond/60 p-4 sm:p-5 xl:grid-cols-2">
          {droits.map((droit) => (
            <CarteDroit key={droit.id} droit={droit} />
          ))}
        </div>
      )}
      <PaginationListe page={page} nombrePages={nombrePages} lienPage={lienPage} textes={textes} />
    </section>
  );
}
