import Link from "next/link";
import { Search, X } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection, type OptionSelection } from "@/components/ui/champ-selection";
import { CHEMIN_PERSONNES, LONGUEUR_MAX_RECHERCHE } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { aDesCriteres, type RechercheEmployes } from "@/lib/validation/recherche-employes";

const textes = TEXTES_PERSONNES.recherche;

/**
 * Barre de filtres de la liste des employés : un simple formulaire GET (fonctionne sans
 * JavaScript, critères gardés dans l'URL, donc partageables et repris par la pagination).
 */
export function FiltresEmployes({ recherche, departements }: { recherche: RechercheEmployes; departements: OptionSelection[] }) {
  return (
    <form
      method="get"
      action={CHEMIN_PERSONNES}
      role="search"
      aria-label={textes.titre}
      className="grid gap-3 border-b border-bordure bg-fond/60 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
    >
      <ChampFormulaire nom="nom" libelle={textes.nom} type="search" defaultValue={recherche.nom} placeholder={textes.exempleNom} maxLength={LONGUEUR_MAX_RECHERCHE} autoComplete="off" />
      <ChampFormulaire
        nom="matricule"
        libelle={textes.matricule}
        type="search"
        defaultValue={recherche.matricule}
        placeholder={textes.exempleMatricule}
        maxLength={LONGUEUR_MAX_RECHERCHE}
        autoComplete="off"
        className="font-mono"
      />
      <ChampSelection nom="departement" libelle={textes.departement} options={departements} optionVide={textes.tous} defaultValue={recherche.departementId ?? ""} />
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Bouton type="submit" variante="contour" className="flex-1 lg:flex-none">
          <Search className="size-4" aria-hidden="true" />
          {textes.rechercher}
        </Bouton>
        {aDesCriteres(recherche) && (
          <Link
            href={CHEMIN_PERSONNES}
            aria-label={textes.effacer}
            title={textes.effacer}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-base font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="lg:sr-only">{textes.effacer}</span>
          </Link>
        )}
      </div>
    </form>
  );
}
