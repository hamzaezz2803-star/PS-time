import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardClock, Search, SearchX, X } from "lucide-react";
import { AvatarEmploye } from "@/components/personnes/avatar-employe";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { CHEMIN_POINTAGES_MANUELS, LONGUEUR_MAX_RECHERCHE } from "@/lib/constantes";
import { formaterDate, formaterHeure } from "@/lib/formats";
import { chaineRecherche } from "@/lib/metier/recherche";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import type { RecherchePointages } from "@/lib/validation/pointage";
import type { StatutPointage } from "@/lib/metier/statut-pointage";
import { TEXTES_STATUT_POINTAGE } from "@/lib/textes/statut-pointage";
import type { PointageListe } from "@/types";
import { PastilleEtat } from "./pastille-etat";
import { ResultatPointage } from "./resultat-pointage";
import { BoutonSupprimerPointage } from "./gestion-pointages";

const textes = TEXTES_EXCEPTIONS.pointages;
const STYLE_LIEN_PAGE =
  "inline-flex min-h-11 items-center gap-1 rounded-lg border border-bordure-champ bg-surface px-3 text-sm font-semibold text-texte hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10";

/** Filtres de la liste : formulaire GET (critères dans l'URL, repris par la pagination). */
function FiltresPointages({ recherche }: { recherche: RecherchePointages }) {
  const estFiltree = recherche.employe !== "" || recherche.jour !== null;
  return (
    <form method="get" action={CHEMIN_POINTAGES_MANUELS} role="search" aria-label={textes.filtres.titre} className="grid gap-3 border-b border-bordure bg-fond/60 px-4 py-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end sm:px-5">
      <ChampFormulaire nom="employe" libelle={textes.filtres.employe} type="search" defaultValue={recherche.employe} placeholder={textes.filtres.exempleEmploye} maxLength={LONGUEUR_MAX_RECHERCHE} autoComplete="off" />
      <ChampFormulaire nom="jour" libelle={textes.filtres.jour} type="date" defaultValue={recherche.jour ?? ""} className="tabular-nums" />
      <div className="flex gap-2">
        <Bouton type="submit" variante="contour" className="flex-1 sm:flex-none">
          <Search className="size-4" aria-hidden="true" />
          {textes.filtres.rechercher}
        </Bouton>
        {estFiltree && (
          <Link href={CHEMIN_POINTAGES_MANUELS} aria-label={textes.filtres.effacer} title={textes.filtres.effacer} className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10">
            <X className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </form>
  );
}

/** Liste paginée des pointages saisis à la main, du plus récent au plus ancien. */
export function ListePointages({
  pointages,
  statuts,
  total,
  page,
  nombrePages,
  recherche,
}: {
  pointages: PointageListe[];
  /** Statut de chaque pointage (même ordre), d'après le planning de l'employé. */
  statuts: StatutPointage[];
  total: number;
  page: number;
  nombrePages: number;
  recherche: RecherchePointages;
}) {
  const estFiltree = recherche.employe !== "" || recherche.jour !== null;
  const lienPage = (numero: number) => `${CHEMIN_POINTAGES_MANUELS}${chaineRecherche({ employe: recherche.employe, jour: recherche.jour, page: numero })}`;
  const c = textes.colonnes;

  return (
    <section className="overflow-hidden rounded-xl border border-bordure bg-surface shadow-carte" aria-labelledby="titre-pointages">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-bordure px-4 py-3.5 sm:px-5">
        <h2 id="titre-pointages" className="text-base font-semibold text-marine">{textes.titreListe}</h2>
        <span className="rounded-md bg-fond px-2 py-0.5 text-sm font-medium tabular-nums text-texte-secondaire ring-1 ring-inset ring-bordure">{textes.total(total)}</span>
      </div>
      {(total > 0 || estFiltree) && <FiltresPointages recherche={recherche} />}

      {pointages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire">
            {estFiltree ? <SearchX className="size-6" aria-hidden="true" /> : <ClipboardClock className="size-6" aria-hidden="true" />}
          </span>
          <p className="text-base font-semibold text-texte">{estFiltree ? textes.aucunResultat : textes.vide}</p>
          {!estFiltree && <p className="text-sm text-texte-secondaire">{textes.videAction}</p>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="border-b border-bordure bg-fond/70 text-texte-secondaire">
              <tr>
                {[c.employe, c.matricule, c.departement, c.date, c.heure, c.etat, TEXTES_STATUT_POINTAGE.colonne, c.remarque, c.saisiPar].map((titre) => (
                  <th key={titre} scope="col" className="px-5 py-3 font-semibold">{titre}</th>
                ))}
                <th scope="col" className="px-5 py-3"><span className="sr-only">{c.actions}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure text-texte">
              {pointages.map((pointage, index) => {
                const nomComplet = `${pointage.prenom} ${pointage.nom}`;
                return (
                  <tr key={pointage.id} className="transition-colors duration-150 hover:bg-fond">
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-3 font-medium">
                        <AvatarEmploye id={pointage.employeId} nomComplet={nomComplet} photoModifieeLe={pointage.photoModifieeLe} />
                        <span className="truncate">{nomComplet}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-marine">{pointage.matricule}</td>
                    <td className="px-5 py-3">{pointage.departement}</td>
                    <td className="whitespace-nowrap px-5 py-3">{formaterDate(pointage.horodatage)}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-marine">{formaterHeure(pointage.horodatage)}</td>
                    <td className="px-5 py-3"><PastilleEtat etat={pointage.etat} /></td>
                    <td className="px-5 py-2.5">{statuts[index] && <ResultatPointage statut={statuts[index]} />}</td>
                    <td className="max-w-56 truncate px-5 py-3 text-texte-secondaire" title={pointage.remarque ?? undefined}>{pointage.remarque ?? "–"}</td>
                    <td className="px-5 py-3 text-texte-secondaire">{pointage.saisiPar ?? "–"}</td>
                    <td className="px-3 py-1.5 text-right">
                      <BoutonSupprimerPointage id={pointage.id} nom={nomComplet} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {nombrePages > 1 && (
        <nav aria-label={textes.pagination} className="flex items-center justify-between gap-3 border-t border-bordure px-5 py-3">
          {page > 1 ? (
            <Link href={lienPage(page - 1)} className={STYLE_LIEN_PAGE}><ChevronLeft className="size-4" aria-hidden="true" />{textes.precedente}</Link>
          ) : <span />}
          <p className="text-sm text-texte-secondaire">{textes.page(page, nombrePages)}</p>
          {page < nombrePages ? (
            <Link href={lienPage(page + 1)} className={STYLE_LIEN_PAGE}>{textes.suivante}<ChevronRight className="size-4" aria-hidden="true" /></Link>
          ) : <span />}
        </nav>
      )}
    </section>
  );
}
