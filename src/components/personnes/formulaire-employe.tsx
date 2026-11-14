"use client";

import Link from "next/link";
import { useActionState } from "react";
import { creerEmploye } from "@/app/(connecte)/personnel/personnes/actions";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection, type OptionSelection } from "@/components/ui/champ-selection";
import { MessageSucces } from "@/components/ui/message-succes";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import {
  CHEMIN_DEPARTEMENTS,
  LONGUEUR_MAX_EMAIL,
  LONGUEUR_MAX_MATRICULE,
  LONGUEUR_MAX_NOM_EMPLOYE,
  TYPES_EMPLOI,
} from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { ChampPersonnalise, EtatFormulaireEmploye } from "@/types";
import { ChampsFacultatifs } from "./champs-facultatifs";

const { formulaire: textes } = TEXTES_PERSONNES;
const ETAT_INITIAL: EtatFormulaireEmploye = {};
const OPTIONS_TYPE_EMPLOI = TYPES_EMPLOI.map((type) => ({
  valeur: type,
  libelle: textes.typesEmploi[type],
}));
const obligatoire = (libelle: string) => `${libelle} *`;

/**
 * Création d'un employé. Après une erreur, la saisie est réaffichée (`valeurs`) ;
 * après une réussite, le formulaire est vidé.
 */
export function FormulaireEmploye({
  departements,
  postes,
  champs,
}: {
  departements: OptionSelection[];
  postes: OptionSelection[];
  champs: ChampPersonnalise[];
}) {
  const [etat, action, enCours] = useActionState(creerEmploye, ETAT_INITIAL);
  const erreurs = etat.erreursChamps;
  const valeurs = etat.valeurs ?? {};

  if (departements.length === 0) {
    return (
      <div className="flex flex-col gap-3 text-base text-texte">
        <p>{textes.aucunDepartement}</p>
        <Link href={CHEMIN_DEPARTEMENTS} className="font-semibold text-primaire underline underline-offset-4">
          {textes.lienDepartements}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-8">
      <MessageSucces message={etat.succes} />
      <p className="text-sm text-texte-secondaire">* {textes.obligatoire}</p>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-base font-semibold text-marine">{textes.sectionPrincipale}</legend>
        <ChampFormulaire
          nom="matricule"
          libelle={obligatoire(textes.matricule)}
          defaultValue={valeurs.matricule ?? ""}
          maxLength={LONGUEUR_MAX_MATRICULE}
          autoComplete="off"
          spellCheck={false}
          required
          aide={textes.aideMatricule}
          erreur={erreurs?.matricule}
        />
        <ChampSelection
          nom="departementId"
          libelle={obligatoire(textes.departement)}
          options={departements}
          optionVide={textes.choisirDepartement}
          defaultValue={valeurs.departementId ?? ""}
          required
          erreur={erreurs?.departementId}
        />
        <ChampFormulaire
          nom="prenom"
          libelle={obligatoire(textes.prenom)}
          defaultValue={valeurs.prenom ?? ""}
          maxLength={LONGUEUR_MAX_NOM_EMPLOYE}
          autoComplete="off"
          required
          erreur={erreurs?.prenom}
        />
        <ChampFormulaire
          nom="nom"
          libelle={obligatoire(textes.nom)}
          defaultValue={valeurs.nom ?? ""}
          maxLength={LONGUEUR_MAX_NOM_EMPLOYE}
          autoComplete="off"
          required
          erreur={erreurs?.nom}
        />
        <ChampFormulaire
          nom="telephone"
          libelle={textes.telephone}
          type="tel"
          inputMode="tel"
          defaultValue={valeurs.telephone ?? ""}
          placeholder={textes.exempleTelephone}
          autoComplete="off"
          erreur={erreurs?.telephone}
        />
        <ChampFormulaire
          nom="email"
          libelle={textes.email}
          type="email"
          defaultValue={valeurs.email ?? ""}
          placeholder={textes.exempleEmail}
          maxLength={LONGUEUR_MAX_EMAIL}
          autoComplete="off"
          spellCheck={false}
          erreur={erreurs?.email}
        />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-base font-semibold text-marine">{textes.sectionEmploi}</legend>
        <ChampSelection
          nom="posteId"
          libelle={textes.poste}
          options={postes}
          optionVide={textes.aucunPoste}
          defaultValue={valeurs.posteId ?? ""}
          erreur={erreurs?.posteId}
        />
        <ChampSelection
          nom="typeEmploi"
          libelle={textes.typeEmploi}
          options={OPTIONS_TYPE_EMPLOI}
          optionVide={textes.aucunTypeEmploi}
          defaultValue={valeurs.typeEmploi ?? ""}
          erreur={erreurs?.typeEmploi}
        />
        <ChampFormulaire
          nom="dateEmbauche"
          libelle={textes.dateEmbauche}
          type="date"
          defaultValue={valeurs.dateEmbauche ?? ""}
          erreur={erreurs?.dateEmbauche}
        />
        <ChampFormulaire
          nom="dateFinEmploi"
          libelle={textes.dateFinEmploi}
          type="date"
          defaultValue={valeurs.dateFinEmploi ?? ""}
          aide={textes.aideDateFin}
          erreur={erreurs?.dateFinEmploi}
        />
      </fieldset>

      <ChampsFacultatifs champs={champs} valeurs={valeurs} erreurs={erreurs} />

      <PiedFormulaire
        message={etat.message}
        enCours={enCours}
        libelle={textes.enregistrer}
        libelleEnCours={textes.enregistrementEnCours}
      />
    </form>
  );
}

