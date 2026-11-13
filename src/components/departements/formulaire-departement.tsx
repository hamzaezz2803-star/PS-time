"use client";

import { useActionState } from "react";
import { enregistrerDepartement } from "@/app/(connecte)/personnel/departements/actions";
import { ChampParent, type OptionParent } from "@/components/arbre/champ-parent";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_NOM_DEPARTEMENT } from "@/lib/constantes";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import type { EtatFormulaireDepartement } from "@/types";

const { formulaire: textes } = TEXTES_DEPARTEMENTS;
const ETAT_INITIAL: EtatFormulaireDepartement = {};
type Succes = NonNullable<EtatFormulaireDepartement["succes"]>;

/** Création (sans `departement`) ou modification d'un département. */
export function FormulaireDepartement({
  departement,
  optionsParent,
  onTermine,
}: {
  departement?: ElementArbre;
  optionsParent: OptionParent[];
  onTermine: (succes: Succes) => void;
}) {
  const [etat, action, enCours] = useActionState(
    async (precedent: EtatFormulaireDepartement, formulaire: FormData) => {
      const resultat = await enregistrerDepartement(precedent, formulaire);
      if (resultat.succes) onTermine(resultat.succes);
      return resultat;
    },
    ETAT_INITIAL,
  );

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {departement && <input type="hidden" name="id" value={departement.id} />}
      <ChampFormulaire
        nom="nom"
        libelle={textes.nom}
        defaultValue={departement?.nom ?? ""}
        placeholder={textes.exempleNom}
        maxLength={LONGUEUR_MAX_NOM_DEPARTEMENT}
        autoComplete="off"
        required
        erreur={etat.erreursChamps?.nom}
      />
      <ChampParent
        libelle={textes.parent}
        aucunParent={textes.aucunParent}
        options={optionsParent}
        valeurInitiale={departement?.parentId ?? null}
        erreur={etat.erreursChamps?.parentId}
      />
      <PiedFormulaire
        message={etat.message}
        enCours={enCours}
        libelle={textes.enregistrer}
        libelleEnCours={textes.enregistrementEnCours}
      />
    </form>
  );
}
