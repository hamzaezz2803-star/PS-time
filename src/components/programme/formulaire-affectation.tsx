"use client";

import { useState } from "react";
import { UserRound, UsersRound } from "lucide-react";
import { enregistrerAffectation } from "@/app/(connecte)/programme/affectations/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { useFormulaireListe, valeurSaisie, type EtatFormulaireListe } from "@/components/liste/utiliser-formulaire-liste";
import { ChampDate } from "@/components/ui/champ-date";
import { ChampSelection, type OptionSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { cn } from "@/lib/utils";
import type { Affectation } from "@/types";

const textes = TEXTES_PROGRAMME.affectations;
type TypeCible = "groupe" | "employe";
const ICONES_CIBLE = { groupe: UsersRound, employe: UserRound } as const;

export type OptionsAffectation = { rotations: OptionSelection[]; groupes: OptionSelection[]; employes: OptionSelection[] };

/** Création (sans `element`) ou modification d'une affectation : cible, rotation et période. */
export function FormulaireAffectation({
  element,
  options,
  onTermine,
  onAnnuler,
}: ProprietesFormulaireListe<Affectation> & { options: OptionsAffectation }) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerAffectation, onTermine);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <ContenuAffectation key={etat.numeroReponse} etat={etat} affectation={element} options={options} />
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

function ContenuAffectation({ etat, affectation, options }: { etat: EtatFormulaireListe; affectation?: Affectation; options: OptionsAffectation }) {
  const cibleInitiale: TypeCible = affectation?.employeId ? "employe" : "groupe";
  const [typeCible, setTypeCible] = useState<TypeCible>(valeurSaisie(etat, "typeCible", cibleInitiale) === "employe" ? "employe" : "groupe");
  const erreurs = etat.erreursChamps;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-texte">{textes.typeCible}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["groupe", "employe"] as const).map((valeur) => {
            const Icone = ICONES_CIBLE[valeur];
            const estChoisi = typeCible === valeur;
            return (
              <label
                key={valeur}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-base font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primaire",
                  estChoisi ? "border-primaire bg-ciel/60 text-marine" : "border-bordure text-texte hover:bg-fond",
                )}
              >
                <input type="radio" name="typeCible" value={valeur} checked={estChoisi} onChange={() => setTypeCible(valeur)} className="sr-only" />
                <Icone className={cn("size-5", estChoisi ? "text-primaire" : "text-texte-secondaire")} aria-hidden="true" />
                {textes.typesCible[valeur]}
              </label>
            );
          })}
        </div>
        <MessageErreur message={erreurs?.typeCible} />
      </fieldset>

      {typeCible === "groupe" ? (
        <ChampSelection nom="groupeId" libelle={textes.groupeCible} options={options.groupes} optionVide={textes.choisirGroupe} defaultValue={valeurSaisie(etat, "groupeId", affectation?.groupeId ?? "")} erreur={erreurs?.groupeId} />
      ) : (
        <ChampSelection nom="employeId" libelle={textes.employeCible} options={options.employes} optionVide={textes.choisirEmploye} defaultValue={valeurSaisie(etat, "employeId", affectation?.employeId ?? "")} erreur={erreurs?.employeId} />
      )}
      <ChampSelection nom="rotationId" libelle={textes.rotation} options={options.rotations} optionVide={textes.choisirRotation} defaultValue={valeurSaisie(etat, "rotationId", affectation?.rotationId ?? "")} erreur={erreurs?.rotationId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <ChampDate nom="dateDebut" libelle={textes.dateDebut} defaultValue={valeurSaisie(etat, "dateDebut", affectation?.dateDebut ?? "")} required erreur={erreurs?.dateDebut} />
        <ChampDate nom="dateFin" libelle={textes.dateFin} defaultValue={valeurSaisie(etat, "dateFin", affectation?.dateFin ?? "")} aide={textes.aideDateFin} erreur={erreurs?.dateFin} />
      </div>
    </div>
  );
}
