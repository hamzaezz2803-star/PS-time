"use client";

import { ChampFormulaire } from "@/components/ui/champ-formulaire";
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
      <ChampFormulaire nom="dateEmbauche" libelle={textes.dateEmbauche} type="date" defaultValue={valeurs.dateEmbauche ?? ""} erreur={erreurs?.dateEmbauche} />
      <ChampFormulaire nom="dateDebutEmploi" libelle={textes.dateDebutEmploi} type="date" defaultValue={valeurs.dateDebutEmploi ?? ""} aide={textes.aideDateDebut} erreur={erreurs?.dateDebutEmploi} />
      <ChampFormulaire nom="dateFinEmploi" libelle={textes.dateFinEmploi} type="date" defaultValue={valeurs.dateFinEmploi ?? ""} aide={textes.aideDateFin} erreur={erreurs?.dateFinEmploi} />
    </div>
  );
}
