import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { TEXTES_ESPACE } from "@/lib/textes/espace";

/** Chiffre clé du tableau de bord (valeur réelle lue en base), qui mène à sa page. */
export function CarteCompteur({
  href,
  libelle,
  total,
  Icone,
}: {
  href: string;
  libelle: string;
  total: number;
  Icone: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-5 rounded-xl border border-bordure bg-surface p-5 shadow-carte transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primaire/40 hover:shadow-survol focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-ciel text-primaire">
          <Icone className="size-5" aria-hidden="true" />
        </span>
        <ArrowUpRight
          className="size-5 text-texte-secondaire transition-colors duration-150 group-hover:text-primaire"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-texte-secondaire">{libelle}</span>
        <span className="text-3xl font-bold tracking-tight tabular-nums text-marine">{total}</span>
      </div>
      <span className="border-t border-bordure pt-3 text-sm font-medium text-primaire">{TEXTES_ESPACE.voir(libelle)}</span>
    </Link>
  );
}

/** Emplacement d'une carte pendant le chargement. */
export function CarteCompteurSquelette() {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-bordure bg-surface p-5 shadow-carte" aria-hidden="true">
      <span className="size-11 animate-pulse rounded-lg bg-canevas motion-reduce:animate-none" />
      <div className="flex flex-col gap-2">
        <span className="h-4 w-24 animate-pulse rounded bg-canevas motion-reduce:animate-none" />
        <span className="h-8 w-16 animate-pulse rounded bg-canevas motion-reduce:animate-none" />
      </div>
      <span className="h-4 w-32 animate-pulse rounded bg-canevas motion-reduce:animate-none" />
    </div>
  );
}
