import { ChevronLeft, ChevronRight, SearchX, UsersRound } from "lucide-react";
import Link from "next/link";
import { CHEMIN_PERSONNES } from "@/lib/constantes";
import { formaterJour } from "@/lib/formats";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { formaterTelephone } from "@/lib/metier/employes";
import { chaineRecherche } from "@/lib/metier/recherche";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { EmployeListe } from "@/types";
import { aDesCriteres, parametresRecherche, type RechercheEmployes } from "@/lib/validation/recherche-employes";
import { ActionsLigneEmploye } from "./actions-ligne-employe";
import { AvatarEmploye } from "./avatar-employe";
import { FiltresEmployes } from "./filtres-employes";
import { MenuExport } from "./menu-export";

const { liste: textes, recherche: textesRecherche } = TEXTES_PERSONNES;

const STYLE_LIEN_PAGE =
  "inline-flex min-h-11 items-center gap-1 rounded-lg border border-bordure-champ bg-surface px-3 text-sm font-semibold text-texte hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10";

/** Liste paginée et filtrable des employés, avec un état vide utile. */
export function ListeEmployes({
  employes,
  total,
  page,
  nombrePages,
  recherche,
  departements,
}: {
  employes: EmployeListe[];
  total: number;
  page: number;
  nombrePages: number;
  recherche: RechercheEmployes;
  departements: OptionSelection[];
}) {
  const estFiltree = aDesCriteres(recherche);
  const criteres = parametresRecherche(recherche);
  const lienPage = (numero: number) => `${CHEMIN_PERSONNES}${chaineRecherche({ ...criteres, page: numero })}`;

  return (
    <section
      className="rounded-xl border border-bordure bg-surface shadow-carte"
      aria-labelledby="titre-liste-employes"
    >
      <div className="flex flex-wrap items-center gap-2.5 border-b border-bordure px-4 py-3.5 sm:px-5">
        <h2 id="titre-liste-employes" className="text-base font-semibold text-marine">
          {textes.titre}
        </h2>
        <span className="rounded-md bg-fond px-2 py-0.5 text-sm font-medium tabular-nums text-texte-secondaire ring-1 ring-inset ring-bordure">
          {estFiltree ? textesRecherche.resultats(total) : textes.total(total)}
        </span>
        {total > 0 && <MenuExport requete={chaineRecherche(criteres)} />}
      </div>
      {(total > 0 || estFiltree) && <FiltresEmployes recherche={recherche} departements={departements} />}

      {employes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire">
            {estFiltree ? <SearchX className="size-6" aria-hidden="true" /> : <UsersRound className="size-6" aria-hidden="true" />}
          </span>
          {estFiltree ? (
            <div>
              <p className="text-base font-semibold text-texte">{textesRecherche.aucun}</p>
              <p className="mt-1 text-sm text-texte-secondaire">{textesRecherche.aucunAction}</p>
            </div>
          ) : (
            <p className="max-w-md text-base text-texte-secondaire">{textes.vide}</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-b-xl">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-bordure bg-fond/70 text-texte-secondaire">
              <tr>
                {[textes.matricule, textes.numeroBadge, textes.nomComplet, textes.departement, textes.poste, textes.telephone, textes.dateEmbauche].map(
                  (titre) => (
                    <th key={titre} scope="col" className="px-5 py-3 font-semibold">
                      {titre}
                    </th>
                  ),
                )}
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  <span className="sr-only">{textes.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure text-texte">
              {employes.map((employe) => (
                <tr key={employe.id} className="transition-colors duration-150 hover:bg-fond">
                  <td className="px-5 py-3 font-mono font-medium tabular-nums text-marine">{employe.matricule}</td>
                  <td className="px-5 py-3 font-mono tabular-nums text-texte-secondaire">{employe.numeroBadge}</td>
                  <td className="px-5 py-2.5">
                    <span className="flex items-center gap-3 font-medium">
                      <AvatarEmploye id={employe.id} nomComplet={`${employe.prenom} ${employe.nom}`} photoModifieeLe={employe.photoModifieeLe} />
                      <span className="truncate">{`${employe.nom} ${employe.prenom}`}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">{employe.departement}</td>
                  <td className="px-5 py-3">{employe.poste ?? <NonRenseigne />}</td>
                  <td className="px-5 py-3 whitespace-nowrap tabular-nums">
                    {employe.telephone ? formaterTelephone(employe.telephone) : <NonRenseigne />}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {employe.dateEmbauche ? formaterJour(employe.dateEmbauche) : <NonRenseigne />}
                  </td>
                  <td className="px-3 py-1.5">
                    <ActionsLigneEmploye employe={{ id: employe.id, nomComplet: `${employe.prenom} ${employe.nom}` }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nombrePages > 1 && (
        <nav
          aria-label={textes.pagination}
          className="flex items-center justify-between gap-3 border-t border-bordure px-5 py-3 sm:px-6"
        >
          {page > 1 ? (
            <Link href={lienPage(page - 1)} className={STYLE_LIEN_PAGE}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              {textes.precedente}
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-texte-secondaire">{textes.page(page, nombrePages)}</p>
          {page < nombrePages ? (
            <Link href={lienPage(page + 1)} className={STYLE_LIEN_PAGE}>
              {textes.suivante}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}

function NonRenseigne() {
  return <span className="text-texte-secondaire">{textes.nonRenseigne}</span>;
}

