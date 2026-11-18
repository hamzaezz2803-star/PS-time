import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CHEMIN_HISTORIQUE, HISTORIQUE_PAR_PAGE } from "@/lib/constantes";
import { TEXTES_HISTORIQUE } from "@/lib/textes/historique";
import { cn } from "@/lib/utils";
import { chaineHistorique, type RechercheHistorique } from "@/lib/validation/historique";

const textes = TEXTES_HISTORIQUE.liste;
const LIEN = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-bordure-champ bg-surface px-3.5 text-sm font-semibold text-texte shadow-carte transition-colors duration-150 hover:bg-fond focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-10";

function LienPage({ page, recherche, desactive, children }: { page: number; recherche: RechercheHistorique; desactive: boolean; children: ReactNode }) {
  if (desactive) return <span aria-disabled="true" className={cn(LIEN, "cursor-not-allowed opacity-50 shadow-none")}>{children}</span>;
  return <Link href={`${CHEMIN_HISTORIQUE}${chaineHistorique(recherche, page)}`} className={LIEN}>{children}</Link>;
}

/** « 51 à 100 sur 324 », puis pages précédente et suivante (les filtres sont gardés). */
export function PaginationHistorique({ recherche, page, pages, total }: { recherche: RechercheHistorique; page: number; pages: number; total: number }) {
  if (total === 0) return null;
  const debut = (page - 1) * HISTORIQUE_PAR_PAGE + 1;
  const fin = Math.min(page * HISTORIQUE_PAR_PAGE, total);
  return (
    <nav aria-label={textes.pagination} className="flex flex-col items-center justify-between gap-3 border-t border-bordure pt-4 sm:flex-row">
      <p className="text-sm tabular-nums text-texte-secondaire">
        {textes.plage(debut, fin, total)} · {textes.page(page, pages)}
      </p>
      <div className="flex gap-2">
        <LienPage page={page - 1} recherche={recherche} desactive={page <= 1}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          {textes.precedente}
        </LienPage>
        <LienPage page={page + 1} recherche={recherche} desactive={page >= pages}>
          {textes.suivante}
          <ChevronRight className="size-4" aria-hidden="true" />
        </LienPage>
      </div>
    </nav>
  );
}
