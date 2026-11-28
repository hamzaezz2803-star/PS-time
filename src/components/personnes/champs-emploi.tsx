"use client";

import { ChampDate } from "@/components/ui/champ-date";
import { ChampSelection } from "@/components/ui/champ-selection";
import { TYPES_EMPLOI } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

const { formulaire: textes } = TEXTES_PERSONNES;
const OPTIONS_TYPE_EMPLOI = TYPES_EMPLOI.map((type) => ({ valeur: type, libelle: textes.typesEmploi[type] }));

/** Onglet « Emploi » : type de contrat et dates (tous facultatifs). */
export function ChampsEmploi({
  valeurs,
  erreurs,
}: {
  valeurs: Record<string, string>;
  erreurs?: Record<string, string | undefined>;
}) {
  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      <ChampSelection nom="typeEmploi" libelle={textes.typeEmploi} options={OPTIONS_TYPE_EMPLOI} optionVide={textes.aucunTypeEmploi} defaultValue={valeurs.typeEmploi ?? ""} erreur={erreurs?.typeEmploi} />
      <ChampDate nom="dateEmbauche" libelle={textes.dateEmbauche} defaultValue={valeurs.dateEmbauche ?? ""} erreur={erreurs?.dateEmbauche} />
      <ChampDate nom="dateDebutEmploi" libelle={textes.dateDebutEmploi} defaultValue={valeurs.dateDebutEmploi ?? ""} erreur={erreurs?.dateDebutEmploi} />
      <ChampDate nom="dateFinEmploi" libelle={textes.dateFinEmploi} defaultValue={valeurs.dateFinEmploi ?? ""} erreur={erreurs?.dateFinEmploi} />
    </div>
  );
}
