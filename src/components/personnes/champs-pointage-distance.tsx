"use client";

import { useState } from "react";
import { Info, Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { MessageErreur } from "@/components/ui/message-erreur";
import { APPAREILS_POINTAGE, type AppareilPointage } from "@/lib/constantes";
import { texteVersAppareils } from "@/lib/metier/acces-pointage";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { cn } from "@/lib/utils";
import { CHAMPS_ACCES } from "@/lib/validation/acces-pointage";

const textes = TEXTES_PERSONNES.acces;
const ICONES: Record<AppareilPointage, LucideIcon> = { pc: Monitor, tablette: Tablet, telephone: Smartphone };

/** Carte cochable d'un appareil : icône, nom et aide, bordure épaisse et fond quand il est coché. */
function CarteAppareil({ appareil, estCoche, onBasculer }: { appareil: AppareilPointage; estCoche: boolean; onBasculer: () => void }) {
  const Icone = ICONES[appareil];
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primaire",
        estCoche ? "border-2 border-primaire bg-ciel" : "border-bordure-champ bg-surface hover:bg-fond",
      )}
    >
      <input type="checkbox" name={CHAMPS_ACCES.appareils} value={appareil} checked={estCoche} onChange={onBasculer} className="mt-1 size-5 shrink-0 accent-primaire" />
      <Icone className={cn("mt-0.5 size-6 shrink-0", estCoche ? "text-primaire" : "text-texte-secondaire")} aria-hidden="true" />
      <span className="flex flex-col">
        <span className="font-medium text-texte">{textes.nomsAppareils[appareil]}</span>
        <span className="text-sm text-texte-secondaire">{textes.aidesAppareils[appareil]}</span>
      </span>
    </label>
  );
}

/** Onglet « Pointage à distance » : autorisation, appareils permis et conditions exigées. */
export function ChampsPointageDistance({ valeurs, erreurs }: { valeurs: Record<string, string>; erreurs?: Record<string, string | undefined> }) {
  const [estAutorise, setEstAutorise] = useState(valeurs[CHAMPS_ACCES.pointageDistance] === "oui");
  const [appareils, setAppareils] = useState<AppareilPointage[]>(() => texteVersAppareils(valeurs[CHAMPS_ACCES.appareils] ?? ""));
  const basculer = (appareil: AppareilPointage) =>
    setAppareils((actuels) => (actuels.includes(appareil) ? actuels.filter((element) => element !== appareil) : [...actuels, appareil]));

  return (
    <div className="flex flex-col gap-5">
      <CaseACocher nom={CHAMPS_ACCES.pointageDistance} libelle={textes.autoriser} aide={textes.aideAutoriser} checked={estAutorise} onChange={(e) => setEstAutorise(e.target.checked)} />

      {estAutorise ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-texte">{textes.appareils} *</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {APPAREILS_POINTAGE.map((appareil) => (
                <CarteAppareil key={appareil} appareil={appareil} estCoche={appareils.includes(appareil)} onBasculer={() => basculer(appareil)} />
              ))}
            </div>
            <MessageErreur message={erreurs?.[CHAMPS_ACCES.appareils]} />
          </fieldset>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium text-texte">{textes.conditions}</legend>
            <CaseACocher nom={CHAMPS_ACCES.exigePosition} libelle={textes.exigePosition} aide={textes.aideExigePosition} defaultChecked={valeurs[CHAMPS_ACCES.exigePosition] === "oui"} />
            <CaseACocher nom={CHAMPS_ACCES.exigePhoto} libelle={textes.exigePhoto} aide={textes.aideExigePhoto} defaultChecked={valeurs[CHAMPS_ACCES.exigePhoto] === "oui"} />
          </fieldset>
        </>
      ) : (
        <p className="rounded-lg bg-fond px-3 py-2.5 text-sm text-texte-secondaire">{textes.nonAutorise}</p>
      )}

      <p className="flex items-start gap-2 text-sm text-texte-secondaire">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {textes.aVenir}
      </p>
    </div>
  );
}
