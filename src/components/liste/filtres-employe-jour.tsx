import Link from "next/link";
import { Search, X } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { ChampDate } from "@/components/ui/champ-date";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { LONGUEUR_MAX_RECHERCHE } from "@/lib/constantes";

export type TextesFiltresEmployeJour = {
  titre: string;
  employe: string;
  exempleEmploye: string;
  jour: string;
  rechercher: string;
  effacer: string;
};

/** Filtres d'une liste par employé (nom ou matricule) et jour : formulaire GET, critères dans l'URL. */
export function FiltresEmployeJour({
  chemin,
  recherche,
  textes,
}: {
  chemin: string;
  recherche: { employe: string; jour: string | null };
  textes: TextesFiltresEmployeJour;
}) {
  const estFiltree = recherche.employe !== "" || recherche.jour !== null;
  return (
    <form method="get" action={chemin} role="search" aria-label={textes.titre} className="grid gap-3 border-b border-bordure bg-fond/60 px-4 py-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end sm:px-5">
      <ChampFormulaire nom="employe" libelle={textes.employe} type="search" defaultValue={recherche.employe} placeholder={textes.exempleEmploye} maxLength={LONGUEUR_MAX_RECHERCHE} autoComplete="off" />
      <ChampDate nom="jour" libelle={textes.jour} defaultValue={recherche.jour ?? ""} />
      <div className="flex gap-2">
        <Bouton type="submit" variante="contour" className="flex-1 sm:flex-none">
          <Search className="size-4" aria-hidden="true" />
          {textes.rechercher}
        </Bouton>
        {estFiltree && (
          <Link href={chemin} aria-label={textes.effacer} title={textes.effacer} className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10">
            <X className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </form>
  );
}
