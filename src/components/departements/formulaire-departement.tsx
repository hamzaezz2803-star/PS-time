"use client";

import { useActionState } from "react";
import { enregistrerDepartement } from "@/app/(connecte)/personnel/departements/actions";
import { ChampParent, type OptionParent } from "@/components/arbre/champ-parent";
import { ChampSite } from "@/components/sites/champ-site";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_NOM_DEPARTEMENT } from "@/lib/constantes";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import type { Departement, EtatFormulaireDepartement } from "@/types";

const { formulaire: textes } = TEXTES_DEPARTEMENTS;
const ETAT_INITIAL: EtatFormulaireDepartement = {};
type Succes = NonNullable<EtatFormulaireDepartement["succes"]>;

/** Création (sans `departement`) ou modification d'un département. */
export function FormulaireDepartement({
  departement,
  optionsParent,
  sites,
  onTermine,
  onAnnuler,
}: {
  departement?: Departement;
  optionsParent: OptionParent[];
  sites: OptionSelection[];
  onTermine: (succes: Succes) => void;
  onAnnuler: () => void;
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
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {departement && <input type="hidden" name="id" value={departement.id} />}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
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
        <ChampSite sites={sites} valeurInitiale={departement?.siteId ?? null} erreur={etat.erreursChamps?.siteId} />
        <ChampParent
          libelle={textes.parent}
          aucunParent={textes.aucunParent}
          options={optionsParent}
          valeurInitiale={departement?.parentId ?? null}
          erreur={etat.erreursChamps?.parentId}
        />
      </div>
      <PiedFormulaire
        message={etat.message}
        enCours={enCours}
        libelle={textes.enregistrer}
        libelleEnCours={textes.enregistrementEnCours}
        libelleAnnuler={textes.annuler}
        onAnnuler={onAnnuler}
      />
    </form>
  );
}
