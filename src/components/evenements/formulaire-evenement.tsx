"use client";

import { useState, type ReactNode } from "react";
import { CalendarX2, Plane } from "lucide-react";
import { enregistrerEvenement } from "@/app/(connecte)/exceptions/evenements/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { caseSaisie, useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChoixCartes, type OptionCarte } from "@/components/ui/choix-cartes";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_CODE_EVENEMENT, LONGUEUR_MAX_CODE_PAIE, LONGUEUR_MAX_NOM_EVENEMENT, PRIORITE_EVENEMENT_MAX } from "@/lib/constantes";
import type { PeriodePrise } from "@/lib/metier/evenements";
import { TEXTES_EVENEMENTS as textes } from "@/lib/textes/evenements";
import { lireTexte } from "@/lib/validation/commun";
import type { Evenement } from "@/types";
import { EditeurPeriodes } from "./editeur-periodes";

const { champs, sections } = textes;
type TypeEvenement = Evenement["type"];

const OPTIONS_TYPE: OptionCarte<TypeEvenement>[] = [
  { valeur: "absence", libelle: textes.types.absence, Icone: CalendarX2, aide: textes.aideTypes.absence },
  { valeur: "presence", libelle: textes.types.presence, Icone: Plane, aide: textes.aideTypes.presence },
];

/** Périodes : la dernière saisie après une erreur, sinon celles de l'événement. */
function periodesInitiales(saisie: FormData | undefined, evenement: Evenement | undefined): PeriodePrise[] {
  if (!saisie) return evenement?.periodes ?? [];
  const fins = saisie.getAll("periodeFin").map(lireTexte);
  return saisie.getAll("periodeDebut").map((debut, rang) => ({ debut: lireTexte(debut), fin: fins[rang] ?? "" }));
}

/** Titre d'une partie du formulaire. */
function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-base font-semibold text-marine">{titre}</legend>
      {children}
    </fieldset>
  );
}

/** Création (sans `element`) ou modification d'un événement, en une seule fenêtre. */
export function FormulaireEvenement({ element, onTermine, onAnnuler }: ProprietesFormulaireListe<Evenement>) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerEvenement, onTermine);
  const erreurs = etat.erreursChamps;
  const typeInitial = valeurSaisie(etat, "type", element?.type ?? "absence") === "presence" ? "presence" : "absence";
  const [type, setType] = useState<TypeEvenement>(typeInitial);
  const coche = (nom: "estSaisiEnHeures" | "estPrioritaireSurPointages" | "estVisiblePlanning", parDefaut: boolean) =>
    caseSaisie(etat, nom, element?.[nom] ?? parDefaut);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <ChampFormulaire nom="code" libelle={champs.code} defaultValue={valeurSaisie(etat, "code", element?.code ?? "")} maxLength={LONGUEUR_MAX_CODE_EVENEMENT} autoComplete="off" autoCapitalize="characters" spellCheck={false} required className="uppercase" aide={champs.aideCode} erreur={erreurs?.code} data-focus-initial />
            <ChampFormulaire nom="nom" libelle={champs.nom} defaultValue={valeurSaisie(etat, "nom", element?.nom ?? "")} placeholder={champs.exempleNom} maxLength={LONGUEUR_MAX_NOM_EVENEMENT} autoComplete="off" required erreur={erreurs?.nom} />
          </div>
          <ChoixCartes nom="type" legende={champs.type} options={OPTIONS_TYPE} valeur={type} onChanger={setType} />
          <MessageErreur message={erreurs?.type} />
        </div>

        <Section titre={sections.regles}>
          <CaseACocher nom="estSaisiEnHeures" libelle={champs.estSaisiEnHeures} aide={champs.aideSaisiEnHeures} defaultChecked={coche("estSaisiEnHeures", false)} />
          <CaseACocher nom="estPrioritaireSurPointages" libelle={champs.estPrioritaireSurPointages} aide={champs.aidePrioritaire} defaultChecked={coche("estPrioritaireSurPointages", false)} />
          <CaseACocher nom="estVisiblePlanning" libelle={champs.estVisiblePlanning} aide={champs.aideVisible} defaultChecked={coche("estVisiblePlanning", true)} />
          <div className="max-w-xs">
            <ChampFormulaire nom="priorite" libelle={champs.priorite} defaultValue={valeurSaisie(etat, "priorite", String(element?.priorite ?? 0))} inputMode="numeric" maxLength={3} placeholder={`0 – ${PRIORITE_EVENEMENT_MAX}`} aide={champs.aidePriorite} erreur={erreurs?.priorite} className="tabular-nums" />
          </div>
        </Section>

        <EditeurPeriodes initiales={periodesInitiales(etat.saisie, element)} erreur={erreurs?.periodes} />

        <Section titre={sections.paie}>
          <div className="max-w-xs">
            <ChampFormulaire nom="codePaie" libelle={champs.codePaie} defaultValue={valeurSaisie(etat, "codePaie", element?.codePaie ?? "")} maxLength={LONGUEUR_MAX_CODE_PAIE} autoComplete="off" spellCheck={false} aide={champs.aideCodePaie} erreur={erreurs?.codePaie} />
          </div>
        </Section>
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
