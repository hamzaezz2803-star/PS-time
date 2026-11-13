"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { enregistrerDepartement } from "@/app/(connecte)/personnel/departements/actions";
import { Bouton } from "@/components/ui/bouton";
import { ChampSaisie } from "@/components/ui/champ-saisie";
import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";
import { LONGUEUR_MAX_NOM_DEPARTEMENT } from "@/lib/constantes";
import type { DepartementPlat } from "@/lib/metier/arbre-departements";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import type { EtatFormulaireDepartement } from "@/types";

const { formulaire: textes } = TEXTES_DEPARTEMENTS;
const ETAT_INITIAL: EtatFormulaireDepartement = {};
const ESPACES_PAR_NIVEAU = 4;

export type OptionParent = { id: string; nom: string; profondeur: number };
type Succes = NonNullable<EtatFormulaireDepartement["succes"]>;

/** Création (sans `departement`) ou modification d'un département. */
export function FormulaireDepartement({
  departement,
  parentParDefaut,
  optionsParent,
  onTermine,
}: {
  departement?: DepartementPlat;
  parentParDefaut: string | null;
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
  const erreurNom = etat.erreursChamps?.nom;
  const erreurParent = etat.erreursChamps?.parentId;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {departement && <input type="hidden" name="id" value={departement.id} />}

      <div className="flex flex-col gap-2">
        <Etiquette htmlFor="nom">{textes.nom}</Etiquette>
        <ChampSaisie
          id="nom"
          name="nom"
          defaultValue={departement?.nom ?? ""}
          placeholder={textes.exempleNom}
          maxLength={LONGUEUR_MAX_NOM_DEPARTEMENT}
          autoComplete="off"
          required
          aria-invalid={erreurNom ? true : undefined}
          aria-describedby={erreurNom ? "erreur-nom" : undefined}
        />
        <MessageErreur id="erreur-nom" message={erreurNom} />
      </div>

      <div className="flex flex-col gap-2">
        <Etiquette htmlFor="parentId">{textes.parent}</Etiquette>
        <select
          id="parentId"
          name="parentId"
          defaultValue={departement ? (departement.parentId ?? "") : (parentParDefaut ?? "")}
          aria-invalid={erreurParent ? true : undefined}
          aria-describedby={erreurParent ? "erreur-parent" : undefined}
          className="h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte shadow-[0_1px_2px_rgb(15_27_51/0.04)] lg:h-10 focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire aria-invalid:border-erreur"
        >
          <option value="">{textes.aucunParent}</option>
          {optionsParent.map((option) => (
            <option key={option.id} value={option.id}>
              {" ".repeat(option.profondeur * ESPACES_PAR_NIVEAU) + option.nom}
            </option>
          ))}
        </select>
        <MessageErreur id="erreur-parent" message={erreurParent} />
      </div>

      <div role="alert" aria-live="polite">
        <MessageErreur
          message={etat.message}
          className="rounded-lg border border-erreur/30 bg-erreur/5 p-3"
        />
      </div>

      <Bouton type="submit" disabled={enCours} className="w-full sm:w-fit">
        {enCours && (
          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        )}
        {enCours ? textes.enregistrementEnCours : textes.enregistrer}
      </Bouton>
    </form>
  );
}
