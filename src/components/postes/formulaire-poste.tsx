"use client";

import { useActionState } from "react";
import { enregistrerPoste } from "@/app/(connecte)/personnel/postes/actions";
import { ChampParent, type OptionParent } from "@/components/arbre/champ-parent";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
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
  onTermine,
}: {
  poste?: Poste;
  optionsParent: OptionParent[];
  onTermine: (succes: Succes) => void;
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
    <form action={action} noValidate className="flex flex-col gap-5">
      {poste && <input type="hidden" name="id" value={poste.id} />}
      <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ChampFormulaire
          nom="code"
          libelle={textes.code}
          defaultValue={poste?.code ?? ""}
          placeholder={textes.exempleCode}
          maxLength={LONGUEUR_MAX_CODE_POSTE}
          autoComplete="off"
          spellCheck={false}
          required
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
      </div>
      <p className="-mt-3 text-sm text-texte-secondaire">{textes.aideCode}</p>
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
      <ChampParent
        libelle={textes.parent}
        aucunParent={textes.aucunParent}
        options={optionsParent}
        valeurInitiale={poste?.parentId ?? null}
        erreur={erreurs?.parentId}
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
