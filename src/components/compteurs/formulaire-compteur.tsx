"use client";

import { useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import { enregistrerCompteur } from "@/app/(connecte)/presence/compteurs/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { caseSaisie, useFormulaireListe, valeurSaisie, type EtatFormulaireListe } from "@/components/liste/utiliser-formulaire-liste";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_DESCRIPTION_COMPTEUR } from "@/lib/constantes";
import { changeLaVersion, UNITES_COMPTEUR, type UniteCompteur } from "@/lib/metier/compteurs/format";
import { PERIODICITES, type Periodicite } from "@/lib/metier/compteurs/periodes";
import { variablesPour } from "@/lib/metier/compteurs/variables";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES } from "@/lib/textes/variables-compteurs";
import { erreurFormule } from "@/lib/validation/compteur";
import { cn } from "@/lib/utils";
import type { Compteur } from "@/types";
import { AideFormule } from "./aide-formule";
import { useCodesEvenements } from "./contexte-codes";
import { EditeurFormule } from "./editeur-formule";
import { FicheCompteurStandard } from "./fiche-compteur-standard";
import { TestFormule } from "./test-formule";
import { VersionsCompteur } from "./versions-compteur";

const OPTIONS_UNITES = UNITES_COMPTEUR.map((unite) => ({ valeur: unite, libelle: textes.unites[unite] }));

/**
 * Fenêtre d'un compteur : fiche en lecture seule pour un compteur standard (fixe), sinon création
 * (sans `element`) ou modification : identité, formule, aide, essai et historique.
 */
export function FormulaireCompteur(proprietes: ProprietesFormulaireListe<Compteur>) {
  const { element, onAnnuler } = proprietes;
  if (element?.pack) return <FicheCompteurStandard compteur={element} fiche={element.pack} onFermer={onAnnuler} />;
  return <EditionCompteur {...proprietes} />;
}

function EditionCompteur({ element, onTermine, onAnnuler }: ProprietesFormulaireListe<Compteur>) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerCompteur, onTermine);
  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <ContenuCompteur key={etat.numeroReponse} etat={etat} compteur={element} />
      <PiedFormulaire message={etat.message} enCours={enCours} libelle={textes.enregistrer} libelleEnCours={textes.enregistrementEnCours} libelleAnnuler={textes.annuler} onAnnuler={onAnnuler} />
    </form>
  );
}

function periodicitesInitiales(etat: EtatFormulaireListe, compteur?: Compteur): Periodicite[] {
  if (etat.saisie) return PERIODICITES.filter((periodicite) => etat.saisie?.getAll("periodicites").includes(periodicite));
  return compteur?.periodicites ?? ["JOUR"];
}

function ContenuCompteur({ etat, compteur }: { etat: EtatFormulaireListe; compteur?: Compteur }) {
  const [periodicites, setPeriodicites] = useState(() => periodicitesInitiales(etat, compteur));
  const [unite, setUnite] = useState<UniteCompteur>(() => (valeurSaisie(etat, "unite", compteur?.unite ?? "minutes") as UniteCompteur));
  const [formule, setFormule] = useState(() => valeurSaisie(etat, "formule", compteur?.formule ?? ""));
  const zone = useRef<HTMLTextAreaElement>(null);
  const erreurs = etat.erreursChamps;
  const { codes } = useCodesEvenements();

  const variablesConnues = useMemo(() => new Set(periodicites.flatMap((periodicite) => variablesPour(periodicite, codes))), [periodicites, codes]);
  const erreurDirecte = formule.trim() === "" ? null : erreurFormule(formule, periodicites, codes);
  const versionChangera = compteur !== undefined && changeLaVersion(compteur, { formule: formule.trim(), unite, periodicites });

  const basculer = (periodicite: Periodicite) =>
    setPeriodicites((actuelles) => PERIODICITES.filter((p) => (p === periodicite ? !actuelles.includes(p) : actuelles.includes(p))));

  /** Insère le texte au curseur ; le curseur se place dans les parenthèses d'une fonction. */
  const inserer = (texte: string) => {
    const element = zone.current;
    const debut = element?.selectionStart ?? formule.length;
    const fin = element?.selectionEnd ?? formule.length;
    setFormule(formule.slice(0, debut) + texte + formule.slice(fin));
    const curseur = debut + (texte.includes("(") ? texte.indexOf("(") + 1 : texte.length);
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(curseur, curseur);
    });
  };

  return (
    <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <ChampFormulaire nom="code" libelle={textes.code} defaultValue={valeurSaisie(etat, "code", compteur?.code ?? "")} readOnly={compteur !== undefined} erreur={erreurs?.code} className="font-mono uppercase read-only:bg-fond" maxLength={30} required />
          <ChampFormulaire nom="libelle" libelle={textes.libelle} defaultValue={valeurSaisie(etat, "libelle", compteur?.nom ?? "")} placeholder={textes.exempleLibelle} erreur={erreurs?.libelle} data-focus-initial={compteur ? true : undefined} maxLength={100} required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-texte">{textes.periodicites}</legend>
            <div className="flex flex-wrap gap-2">
              {PERIODICITES.map((periodicite) => {
                const estCoche = periodicites.includes(periodicite);
                return (
                  <label key={periodicite} className={cn("flex min-h-11 cursor-pointer items-center rounded-lg border px-3.5 text-base font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primaire lg:min-h-10", estCoche ? "border-primaire bg-primaire text-white" : "border-bordure-champ text-texte hover:bg-fond")}>
                    <input type="checkbox" name="periodicites" value={periodicite} checked={estCoche} onChange={() => basculer(periodicite)} className="sr-only" />
                    {TEXTES_PERIODICITES[periodicite]}
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-texte-secondaire">{textes.aidePeriodicites}</p>
            <MessageErreur message={erreurs?.periodicites} />
          </fieldset>
          <ChampSelection nom="unite" libelle={textes.unite} options={OPTIONS_UNITES} value={unite} onChange={(e) => setUnite(e.target.value as UniteCompteur)} erreur={erreurs?.unite} />
        </div>

        <EditeurFormule valeur={formule} onChange={setFormule} variablesConnues={variablesConnues} erreur={erreurs?.formule && formule === valeurSaisie(etat, "formule", "") ? erreurs.formule : erreurDirecte} zoneRef={zone} estVerifiable={periodicites.length > 0} />
        {versionChangera && (
          <p className="flex items-start gap-2 rounded-lg bg-ciel px-3 py-2 text-sm text-marine">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {textes.versionChangera}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium text-texte">{textes.description}</label>
          <textarea id="description" name="description" rows={2} maxLength={LONGUEUR_MAX_DESCRIPTION_COMPTEUR} defaultValue={valeurSaisie(etat, "description", compteur?.description ?? "")} aria-invalid={erreurs?.description ? true : undefined} className="w-full rounded-lg border border-bordure-champ bg-surface px-3.5 py-2.5 text-base text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire" />
          <MessageErreur message={erreurs?.description} />
        </div>
        <div className="flex flex-col gap-1">
          <CaseACocher nom="estActif" libelle={textes.estActif} defaultChecked={caseSaisie(etat, "estActif", compteur?.estActif ?? true)} aria-invalid={erreurs?.estActif ? true : undefined} />
          <MessageErreur message={erreurs?.estActif} />
        </div>

        <TestFormule formule={formule} periodicites={periodicites} unite={unite} />
        {compteur && <VersionsCompteur compteurId={compteur.id} versionActuelle={compteur.version} />}
      </div>

      <div className="lg:sticky lg:top-0 lg:self-start">
        <AideFormule periodicites={periodicites} onInserer={inserer} />
      </div>
    </div>
  );
}
