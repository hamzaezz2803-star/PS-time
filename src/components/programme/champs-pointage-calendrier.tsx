"use client";

import { useState } from "react";
import { Fingerprint, TimerReset } from "lucide-react";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import {
  CALENDRIER_PAR_DEFAUT,
  FENETRE_POINTAGE_MAX_MINUTES,
  HEURES_SUP_MAX_MINUTES,
  TOLERANCE_MAX_MINUTES,
} from "@/lib/constantes";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { ChampMinutes, SectionFormulaire } from "./section-formulaire";

const textes = TEXTES_PROGRAMME.calendriers;
type Champ = keyof typeof CALENDRIER_PAR_DEFAUT;
type Case = "pointageEntreeObligatoire" | "pointageSortieObligatoire" | "heuresSupActives";
const CHAMPS_HEURES_SUP: Champ[] = ["heuresSupApresMinutes", "heuresSupMinimumMinutes", "heuresSupMaximumMinutes"];

/** Sections « Pointage » et « Heures supplémentaires » du formulaire de calendrier. */
export function ChampsPointageCalendrier({
  valeur,
  cocher,
  erreurs,
}: {
  valeur: (nom: Champ) => string;
  cocher: (nom: Case) => boolean;
  erreurs?: Partial<Record<string, string>>;
}) {
  // Ouvertes aussi quand un de leurs champs est en erreur, pour que l'erreur soit visible.
  const [heuresSupActives, setHeuresSupActives] = useState(
    cocher("heuresSupActives") || CHAMPS_HEURES_SUP.some((nom) => erreurs?.[nom]),
  );
  const minutes = (nom: Champ, libelle: string, maximum: number, aide?: string) => (
    <ChampMinutes nom={nom} libelle={libelle} valeur={valeur(nom)} maximum={maximum} aide={aide} erreur={erreurs?.[nom]} />
  );

  return (
    <>
      <SectionFormulaire titre={textes.sections.pointage} icone={Fingerprint}>
        <p className="-mt-2 text-sm text-texte-secondaire">{textes.aideFenetres}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {minutes("entreeAvantMinutes", textes.entreeAvant, FENETRE_POINTAGE_MAX_MINUTES)}
          {minutes("entreeApresMinutes", textes.entreeApres, FENETRE_POINTAGE_MAX_MINUTES)}
          {minutes("sortieAvantMinutes", textes.sortieAvant, FENETRE_POINTAGE_MAX_MINUTES)}
          {minutes("sortieApresMinutes", textes.sortieApres, FENETRE_POINTAGE_MAX_MINUTES)}
          {minutes("retardTolereMinutes", textes.retard, TOLERANCE_MAX_MINUTES)}
          {minutes("departAnticipeTolereMinutes", textes.departAnticipe, TOLERANCE_MAX_MINUTES)}
        </div>
        <p className="-mt-2 text-sm text-texte-secondaire">{textes.aideTolerance}</p>
        <div className="flex flex-col">
          <CaseACocher nom="pointageEntreeObligatoire" libelle={textes.entreeObligatoire} defaultChecked={cocher("pointageEntreeObligatoire")} />
          <CaseACocher nom="pointageSortieObligatoire" libelle={textes.sortieObligatoire} defaultChecked={cocher("pointageSortieObligatoire")} />
        </div>
      </SectionFormulaire>

      <SectionFormulaire titre={textes.sections.heuresSup} icone={TimerReset}>
        <CaseACocher
          nom="heuresSupActives"
          libelle={textes.heuresSupActives}
          checked={heuresSupActives}
          onChange={(e) => setHeuresSupActives(e.target.checked)}
        />
        {/* Masqués mais envoyés : leurs valeurs restent valides quand l'option est désactivée. */}
        <div hidden={!heuresSupActives} className="grid gap-4 sm:grid-cols-3">
          {minutes("heuresSupApresMinutes", textes.heuresSupApres, FENETRE_POINTAGE_MAX_MINUTES)}
          {minutes("heuresSupMinimumMinutes", textes.heuresSupMinimum, FENETRE_POINTAGE_MAX_MINUTES)}
          {minutes("heuresSupMaximumMinutes", textes.heuresSupMaximum, HEURES_SUP_MAX_MINUTES, textes.aideHeuresSupMaximum)}
        </div>
      </SectionFormulaire>
    </>
  );
}
