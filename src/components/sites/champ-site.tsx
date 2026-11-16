import { ChampSelection, type OptionSelection } from "@/components/ui/champ-selection";
import { TEXTES_SITES } from "@/lib/textes/sites";

const { champ: textes } = TEXTES_SITES;

/** Menu déroulant « Site » (facultatif) des formulaires Départements, Postes et Personnes. */
export function ChampSite({
  sites,
  valeurInitiale,
  erreur,
}: {
  sites: OptionSelection[];
  valeurInitiale: string | null;
  erreur?: string;
}) {
  return (
    <ChampSelection
      nom="siteId"
      libelle={textes.libelle}
      options={sites}
      optionVide={textes.aucun}
      defaultValue={valeurInitiale ?? ""}
      erreur={erreur}
    />
  );
}
