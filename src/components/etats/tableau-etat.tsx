import { FileBarChart, SearchX } from "lucide-react";
import { MessageErreur } from "@/components/ui/message-erreur";
import { ETAT_LIGNES_ECRAN_MAX, RAPPORT_LIGNES_MAX } from "@/lib/constantes";
import type { ColonneClasseur } from "@/lib/export/classeur";
import { TEXTES_ETATS } from "@/lib/textes/etats";

const textes = TEXTES_ETATS.tableau;

/**
 * Tableau d'un état : les mêmes lignes de texte que les exports. L'écran en montre
 * ETAT_LIGNES_ECRAN_MAX au plus (l'export contient tout) ; première colonne fixe au défilement.
 */
export function TableauEtat({ titre, vide, colonnes, lignes, estTronque }: { titre: string; vide: string; colonnes: ColonneClasseur[]; lignes: string[][]; estTronque: boolean }) {
  const affichees = lignes.slice(0, ETAT_LIGNES_ECRAN_MAX);
  return (
    <section aria-labelledby="titre-etat" className="overflow-hidden rounded-xl border border-bordure bg-surface shadow-carte">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-bordure px-4 py-3.5 sm:px-5">
        <FileBarChart className="size-5 shrink-0 text-primaire" aria-hidden="true" />
        <h2 id="titre-etat" className="text-base font-semibold text-marine">{titre}</h2>
        <span className="rounded-md bg-ciel px-2 py-0.5 text-sm font-medium tabular-nums text-marine">{textes.total(lignes.length)}</span>
      </div>
      {estTronque && <MessageErreur message={textes.tropDeLignes(RAPPORT_LIGNES_MAX)} className="mx-4 mt-3 sm:mx-5" />}
      {lignes.length > ETAT_LIGNES_ECRAN_MAX && <p className="mx-4 mt-3 text-sm text-texte-secondaire sm:mx-5">{textes.ecranLimite(ETAT_LIGNES_ECRAN_MAX)}</p>}
      {lignes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <SearchX className="size-8 text-texte-secondaire" aria-hidden="true" />
          <p className="text-base font-semibold text-texte">{vide}</p>
          <p className="text-sm text-texte-secondaire">{textes.videAction}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-bordure bg-fond text-texte-secondaire">
              <tr>
                {colonnes.map(({ titre: titreColonne }, rang) => (
                  <th key={titreColonne} scope="col" className={rang === 0 ? "sticky start-0 z-10 whitespace-nowrap bg-fond px-4 py-2.5 font-semibold" : "whitespace-nowrap px-3 py-2.5 font-semibold"}>{titreColonne}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure">
              {affichees.map((ligne, index) => (
                <tr key={index} className="group bg-surface hover:bg-fond">
                  {ligne.map((valeur, rang) =>
                    rang === 0 ? (
                      <th key={rang} scope="row" className="sticky start-0 z-10 whitespace-nowrap bg-surface px-4 py-2 font-medium text-marine tabular-nums shadow-[1px_0_0_var(--color-bordure)] group-hover:bg-fond">{valeur}</th>
                    ) : (
                      <td key={rang} className="whitespace-nowrap px-3 py-2 text-texte tabular-nums">{valeur}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
