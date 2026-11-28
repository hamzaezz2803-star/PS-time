"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarX2, Clock, Plane, Sun, Sunset } from "lucide-react";
import { enregistrerEvenement } from "@/app/(connecte)/exceptions/evenements/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { caseSaisie, useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChoixCartes, type OptionCarte } from "@/components/ui/choix-cartes";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_CODE_EVENEMENT, LONGUEUR_MAX_CODE_PAIE, LONGUEUR_MAX_NOM_EVENEMENT } from "@/lib/constantes";
import { minutesEnHeures } from "@/lib/metier/evenements";
import { TEXTES_EVENEMENTS as textes } from "@/lib/textes/evenements";
import type { Evenement, UniteSaisieEvenement } from "@/types";
import { JaugePriorite } from "./jauge-priorite";

const { champs, sections } = textes;
type TypeEvenement = Evenement["type"];

const OPTIONS_TYPE: OptionCarte<TypeEvenement>[] = [
  { valeur: "absence", libelle: textes.types.absence, Icone: CalendarX2 },
  { valeur: "presence", libelle: textes.types.presence, Icone: Plane },
];

const OPTIONS_UNITE: OptionCarte<UniteSaisieEvenement>[] = [
  { valeur: "journee", libelle: textes.unites.journee, Icone: Sun },
  { valeur: "demi_journee", libelle: textes.unites.demi_journee, Icone: Sunset },
  { valeur: "heures", libelle: textes.unites.heures, Icone: Clock },
];

const lireUnite = (valeur: string): UniteSaisieEvenement => (valeur === "heures" || valeur === "demi_journee" ? valeur : "journee");

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
  const [type, setType] = useState<TypeEvenement>(valeurSaisie(etat, "type", element?.type ?? "absence") === "presence" ? "presence" : "absence");
  const [unite, setUnite] = useState<UniteSaisieEvenement>(lireUnite(valeurSaisie(etat, "uniteSaisie", element?.uniteSaisie ?? "journee")));
  const dureeInitiale = element?.dureeMinutes ? minutesEnHeures(element.dureeMinutes) : "";
  const coche = (nom: "estPrioritaireSurPointages" | "estSoumisDroits" | "estVisiblePlanning", parDefaut: boolean) => caseSaisie(etat, nom, element?.[nom] ?? parDefaut);
  const zoneDefilement = useRef<HTMLDivElement>(null);

  // Après un refus, montre la première erreur : elle peut être en bas de la fenêtre (priorité, paie).
  useEffect(() => {
    if (etat.erreursChamps) zoneDefilement.current?.querySelector("[data-erreur]")?.scrollIntoView({ block: "center" });
  }, [etat]);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <div key={etat.numeroReponse} ref={zoneDefilement} className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <ChampFormulaire nom="code" libelle={champs.code} defaultValue={valeurSaisie(etat, "code", element?.code ?? "")} maxLength={LONGUEUR_MAX_CODE_EVENEMENT} autoComplete="off" autoCapitalize="characters" spellCheck={false} required className="uppercase" erreur={erreurs?.code} data-focus-initial />
            <ChampFormulaire nom="nom" libelle={champs.nom} defaultValue={valeurSaisie(etat, "nom", element?.nom ?? "")} placeholder={champs.exempleNom} maxLength={LONGUEUR_MAX_NOM_EVENEMENT} autoComplete="off" required erreur={erreurs?.nom} />
          </div>
          <ChoixCartes nom="type" legende={champs.type} options={OPTIONS_TYPE} valeur={type} onChanger={setType} />
          <MessageErreur message={erreurs?.type} />
        </div>

        <Section titre={sections.regles}>
          <ChoixCartes nom="uniteSaisie" legende={champs.uniteSaisie} options={OPTIONS_UNITE} valeur={unite} onChanger={setUnite} classeGrille="grid-cols-1 sm:grid-cols-3" />
          <MessageErreur message={erreurs?.uniteSaisie} />
          {unite === "heures" && (
            <div className="max-w-xs">
              <ChampFormulaire nom="dureeHeures" libelle={champs.dureeHeures} defaultValue={valeurSaisie(etat, "dureeHeures", dureeInitiale)} inputMode="decimal" maxLength={5} autoComplete="off" required erreur={erreurs?.dureeHeures} className="tabular-nums" />
            </div>
          )}
          <CaseACocher nom="estPrioritaireSurPointages" libelle={champs.estPrioritaireSurPointages} defaultChecked={coche("estPrioritaireSurPointages", false)} />
          <CaseACocher nom="estSoumisDroits" libelle={champs.estSoumisDroits} defaultChecked={coche("estSoumisDroits", false)} />
          <CaseACocher nom="estVisiblePlanning" libelle={champs.estVisiblePlanning} defaultChecked={coche("estVisiblePlanning", true)} />
          <JaugePriorite valeurInitiale={Number(valeurSaisie(etat, "priorite", String(element?.priorite ?? 0)))} erreur={erreurs?.priorite} />
        </Section>

        <Section titre={sections.paie}>
          <div className="max-w-xs">
            <ChampFormulaire nom="codePaie" libelle={champs.codePaie} defaultValue={valeurSaisie(etat, "codePaie", element?.codePaie ?? "")} maxLength={LONGUEUR_MAX_CODE_PAIE} autoComplete="off" spellCheck={false} erreur={erreurs?.codePaie} />
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
