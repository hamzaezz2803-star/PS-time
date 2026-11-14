import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CHEMIN_PERSONNES } from "@/lib/constantes";
import { formaterJour } from "@/lib/formats";
import { formaterTelephone } from "@/lib/metier/employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { EmployeListe } from "@/types";

const { liste: textes } = TEXTES_PERSONNES;

const STYLE_LIEN_PAGE =
  "inline-flex min-h-11 items-center gap-1 rounded-lg border border-bordure-champ bg-surface px-3 text-sm font-semibold text-texte hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10";

/** Liste paginée des employés, avec un état vide utile. */
export function ListeEmployes({
  employes,
  total,
  page,
  nombrePages,
}: {
  employes: EmployeListe[];
  total: number;
  page: number;
  nombrePages: number;
}) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-bordure bg-surface"
      aria-labelledby="titre-liste-employes"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-bordure px-5 py-4 sm:px-6">
        <h2 id="titre-liste-employes" className="text-lg font-semibold text-marine">
          {textes.titre}
        </h2>
        <p className="text-sm text-texte-secondaire">{textes.total(total)}</p>
      </div>

      {employes.length === 0 ? (
        <p className="p-5 text-base text-texte-secondaire sm:p-6">{textes.vide}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-fond text-texte-secondaire">
              <tr>
                {[textes.matricule, textes.nomComplet, textes.departement, textes.poste, textes.telephone, textes.dateEmbauche].map(
                  (titre) => (
                    <th key={titre} scope="col" className="px-5 py-3 font-medium">
                      {titre}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure text-texte">
              {employes.map((employe) => (
                <tr key={employe.id}>
                  <td className="px-5 py-3 font-mono tabular-nums">{employe.matricule}</td>
                  <td className="px-5 py-3 font-medium">{`${employe.nom} ${employe.prenom}`}</td>
                  <td className="px-5 py-3">{employe.departement}</td>
                  <td className="px-5 py-3">{employe.poste ?? <NonRenseigne />}</td>
                  <td className="px-5 py-3 whitespace-nowrap tabular-nums">
                    {employe.telephone ? formaterTelephone(employe.telephone) : <NonRenseigne />}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {employe.dateEmbauche ? formaterJour(employe.dateEmbauche) : <NonRenseigne />}
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
            <Link href={`${CHEMIN_PERSONNES}?page=${page - 1}`} className={STYLE_LIEN_PAGE}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              {textes.precedente}
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-texte-secondaire">{textes.page(page, nombrePages)}</p>
          {page < nombrePages ? (
            <Link href={`${CHEMIN_PERSONNES}?page=${page + 1}`} className={STYLE_LIEN_PAGE}>
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

