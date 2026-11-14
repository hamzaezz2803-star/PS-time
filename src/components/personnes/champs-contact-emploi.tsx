"use client";

import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection } from "@/components/ui/champ-selection";
import { LONGUEUR_MAX_EMAIL, TYPES_EMPLOI } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

const { formulaire: textes } = TEXTES_PERSONNES;
const OPTIONS_TYPE_EMPLOI = TYPES_EMPLOI.map((type) => ({
  valeur: type,
  libelle: textes.typesEmploi[type],
}));

/** Onglet « Contact et emploi » : informations facultatives de l'employé. */
export function ChampsContactEmploi({
  valeurs,
  erreurs,
}: {
  valeurs: Record<string, string>;
  erreurs?: Record<string, string | undefined>;
}) {
  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      <ChampFormulaire nom="telephone" libelle={textes.telephone} type="tel" inputMode="tel" defaultValue={valeurs.telephone ?? ""} placeholder={textes.exempleTelephone} autoComplete="off" erreur={erreurs?.telephone} />
      <ChampFormulaire nom="email" libelle={textes.email} type="email" defaultValue={valeurs.email ?? ""} placeholder={textes.exempleEmail} maxLength={LONGUEUR_MAX_EMAIL} autoComplete="off" spellCheck={false} erreur={erreurs?.email} />
      <ChampSelection nom="typeEmploi" libelle={textes.typeEmploi} options={OPTIONS_TYPE_EMPLOI} optionVide={textes.aucunTypeEmploi} defaultValue={valeurs.typeEmploi ?? ""} erreur={erreurs?.typeEmploi} />
      <div className="hidden sm:block" aria-hidden="true" />
      <ChampFormulaire nom="dateEmbauche" libelle={textes.dateEmbauche} type="date" defaultValue={valeurs.dateEmbauche ?? ""} erreur={erreurs?.dateEmbauche} />
      <ChampFormulaire nom="dateFinEmploi" libelle={textes.dateFinEmploi} type="date" defaultValue={valeurs.dateFinEmploi ?? ""} aide={textes.aideDateFin} erreur={erreurs?.dateFinEmploi} />
    </div>
  );
}
