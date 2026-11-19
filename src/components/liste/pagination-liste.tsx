import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STYLE_LIEN_PAGE =
  "inline-flex min-h-11 items-center gap-1 rounded-lg border border-bordure-champ bg-surface px-3 text-sm font-semibold text-texte hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10";

export type TextesPagination = { pagination: string; precedente: string; suivante: string; page: (page: number, total: number) => string };

/** Pages précédente et suivante d'une liste paginée par le serveur (rien s'il n'y a qu'une page). */
export function PaginationListe({
  page,
  nombrePages,
  lienPage,
  textes,
}: {
  page: number;
  nombrePages: number;
  lienPage: (numero: number) => string;
  textes: TextesPagination;
}) {
  if (nombrePages <= 1) return null;
  return (
    <nav aria-label={textes.pagination} className="flex items-center justify-between gap-3 border-t border-bordure px-5 py-3">
      {page > 1 ? (
        <Link href={lienPage(page - 1)} className={STYLE_LIEN_PAGE}><ChevronLeft className="size-4" aria-hidden="true" />{textes.precedente}</Link>
      ) : <span />}
      <p className="text-sm text-texte-secondaire">{textes.page(page, nombrePages)}</p>
      {page < nombrePages ? (
        <Link href={lienPage(page + 1)} className={STYLE_LIEN_PAGE}>{textes.suivante}<ChevronRight className="size-4" aria-hidden="true" /></Link>
      ) : <span />}
    </nav>
  );
}
