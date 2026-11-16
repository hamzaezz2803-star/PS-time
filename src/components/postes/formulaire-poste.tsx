"use client";

import { useActionState } from "react";
import { enregistrerPoste } from "@/app/(connecte)/personnel/postes/actions";
import { ChampParent, type OptionParent } from "@/components/arbre/champ-parent";
import { ChampSite } from "@/components/sites/champ-site";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import {
  LONGUEUR_MAX_CODE_POSTE,
  LONGUEUR_MAX_NOM_POSTE,
  ORDRE_POSTE_DEFAUT,
  ORDRE_POSTE_MAX,
  ORDRE_POSTE_MIN,
} from "@/lib/constantes";
import { TEXTES_POSTES } from "@/lib/textes/postes";
import type { EtatFormulairePoste, Poste } from "@/types";

const { formulaire: textes } = TEXTES_POSTES;
const ETAT_INITIAL: EtatFormulairePoste = {};
type Succes = NonNullable<EtatFormulairePoste["succes"]>;

/** Création (sans `poste`) ou modification d'un poste : numéro, nom, ordre et parent. */
export function FormulairePoste({
  poste,
  optionsParent,
  sites,
  onTermine,
  onAnnuler,
}: {
  poste?: Poste;
  optionsParent: OptionParent[];
  sites: OptionSelection[];
  onTermine: (succes: Succes) => void;
  onAnnuler: () => void;
}) {
  const [etat, action, enCours] = useActionState(
    async (precedent: EtatFormulairePoste, formulaire: FormData) => {
      const resultat = await enregistrerPoste(precedent, formulaire);
      if (resultat.succes) onTermine(resultat.succes);
      return resultat;
    },
    ETAT_INITIAL,
  );
  const erreurs = etat.erreursChamps;

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {poste && <input type="hidden" name="id" value={poste.id} />}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
        <ChampFormulaire
          nom="code"
          libelle={textes.code}
          defaultValue={poste?.code ?? ""}
          placeholder={textes.exempleCode}
          maxLength={LONGUEUR_MAX_CODE_POSTE}
          autoComplete="off"
          spellCheck={false}
          required
          aide={textes.aideCode}
          erreur={erreurs?.code}
        />
        <ChampFormulaire
          nom="nom"
          libelle={textes.nom}
          defaultValue={poste?.nom ?? ""}
          placeholder={textes.exempleNom}
          maxLength={LONGUEUR_MAX_NOM_POSTE}
          autoComplete="off"
          required
          erreur={erreurs?.nom}
        />
        <ChampFormulaire
          nom="ordre"
          libelle={textes.ordre}
          type="number"
          inputMode="numeric"
          min={ORDRE_POSTE_MIN}
          max={ORDRE_POSTE_MAX}
          step={1}
          defaultValue={poste?.ordre ?? ORDRE_POSTE_DEFAUT}
          className="tabular-nums sm:max-w-40"
          aide={textes.aideOrdre(ORDRE_POSTE_MIN, ORDRE_POSTE_MAX)}
          erreur={erreurs?.ordre}
        />
        <ChampSite sites={sites} valeurInitiale={poste?.siteId ?? null} erreur={erreurs?.siteId} />
        <ChampParent
          libelle={textes.parent}
          aucunParent={textes.aucunParent}
          options={optionsParent}
          valeurInitiale={poste?.parentId ?? null}
          erreur={erreurs?.parentId}
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
