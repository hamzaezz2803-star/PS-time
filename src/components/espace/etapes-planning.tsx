import Link from "next/link";
import { CalendarClock, CalendarRange, ChevronRight, Repeat, UsersRound, type LucideIcon } from "lucide-react";
import { CHEMIN_AFFECTATIONS, CHEMIN_PROFILS_HORAIRES, CHEMIN_GROUPES, CHEMIN_ROTATIONS } from "@/lib/constantes";
import { peutAcceder, type Droits, type Page } from "@/lib/metier/droits";
import { TEXTES_ESPACE } from "@/lib/textes/espace";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";

const ETAPES: { page: Page; href: string; titre: string; Icone: LucideIcon }[] = [
  { page: "profils_horaires", href: CHEMIN_PROFILS_HORAIRES, titre: TEXTES_NAVIGATION.profilsHoraires, Icone: CalendarClock },
  { page: "rotations", href: CHEMIN_ROTATIONS, titre: TEXTES_NAVIGATION.rotations, Icone: Repeat },
  { page: "groupes", href: CHEMIN_GROUPES, titre: TEXTES_NAVIGATION.groupes, Icone: UsersRound },
  { page: "affectations", href: CHEMIN_AFFECTATIONS, titre: TEXTES_NAVIGATION.affectations, Icone: CalendarRange },
];

/** Les quatre étapes du planning, dans l'ordre où elles se remplissent (seulement les pages accordées). */
export function EtapesPlanning({ droits }: { droits: Droits }) {
  const etapes = ETAPES.map((etape, index) => ({ ...etape, numero: index + 1 })).filter((etape) => peutAcceder(droits, etape.page));
  if (etapes.length === 0) return null;
  return (
    <section aria-labelledby="titre-planning" className="flex flex-col gap-4">
      <h2 id="titre-planning" className="text-lg font-semibold text-marine">{TEXTES_ESPACE.titrePlanning}</h2>
      {/* L'espace d'un pixel laisse voir le fond : il trace les séparations quelle que soit la grille. */}
      <ol className="grid gap-px overflow-hidden rounded-xl border border-bordure bg-bordure shadow-carte sm:grid-cols-2 xl:grid-cols-4">
        {etapes.map(({ href, titre, Icone, numero }) => (
          <li key={href} className="bg-surface">
            <Link
              href={href}
              className="group flex h-full flex-col gap-3 p-5 transition-colors duration-150 hover:bg-fond focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primaire"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-texte-secondaire">{TEXTES_ESPACE.etape(numero)}</span>
                <ChevronRight
                  className="size-4 text-texte-secondaire transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primaire motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </div>
              <span className="flex items-center gap-2.5 text-base font-semibold text-texte">
                <Icone className="size-[18px] shrink-0 text-primaire" aria-hidden="true" />
                {titre}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
