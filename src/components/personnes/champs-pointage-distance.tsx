"use client";

import { useState } from "react";
import { BriefcaseBusiness, ClockArrowUp, KeyRound, LogIn, Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { MessageErreur } from "@/components/ui/message-erreur";
import { APPAREILS_POINTAGE, DROITS_POINTAGE_DISTANCE, type AppareilPointage, type DroitPointageDistance } from "@/lib/constantes";
import { normaliserDroits, texteVersAppareils } from "@/lib/metier/acces-pointage";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { cn } from "@/lib/utils";
import { CHAMPS_ACCES } from "@/lib/validation/acces-pointage";
import type { EmployeDetail } from "@/types";

const textes = TEXTES_PERSONNES.acces;
const ICONES: Record<AppareilPointage, LucideIcon> = { pc: Monitor, tablette: Tablet, telephone: Smartphone };
const ICONES_DROITS: Record<DroitPointageDistance, LucideIcon> = { mission: BriefcaseBusiness, heures_sup: ClockArrowUp };

/**
 * Carte cochable (appareil, type de pointage) : icône et nom, bordure épaisse et fond quand
 * elle est cochée. Sans `onBasculer`, la case est cochée et figée (droit toujours accordé).
 */
function CarteCochable({
  nom,
  valeur,
  Icone,
  libelle,
  estCoche,
  onBasculer,
}: {
  nom: string;
  valeur: string;
  Icone: LucideIcon;
  libelle: string;
  estCoche: boolean;
  onBasculer?: () => void;
}) {
  const estFige = !onBasculer;
  return (
    <label
      className={cn(
        "flex min-h-11 items-start gap-3 rounded-lg border p-3 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primaire",
        estFige ? "cursor-default" : "cursor-pointer",
        estCoche ? "border-2 border-primaire bg-ciel" : "border-bordure-champ bg-surface hover:bg-fond",
      )}
    >
      <input type="checkbox" name={estFige ? undefined : nom} value={valeur} checked={estCoche} onChange={onBasculer} disabled={estFige} className="mt-1 size-5 shrink-0 accent-primaire" />
      <Icone className={cn("mt-0.5 size-6 shrink-0", estCoche ? "text-primaire" : "text-texte-secondaire")} aria-hidden="true" />
      <span className="font-medium text-texte">{libelle}</span>
    </label>
  );
}

/** Types de pointage : la présence, toujours accordée, puis la mission et les heures sup. à cocher. */
function ChoixDroits({ valeurInitiale }: { valeurInitiale: string }) {
  const [droits, setDroits] = useState<DroitPointageDistance[]>(() => normaliserDroits(valeurInitiale.split(",")));
  const basculer = (droit: DroitPointageDistance) =>
    setDroits((actuels) => (actuels.includes(droit) ? actuels.filter((element) => element !== droit) : [...actuels, droit]));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-texte">{textes.droits}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <CarteCochable nom={CHAMPS_ACCES.droits} valeur="presence" Icone={LogIn} libelle={textes.presence} estCoche />
        {DROITS_POINTAGE_DISTANCE.map((droit) => (
          <CarteCochable
            key={droit}
            nom={CHAMPS_ACCES.droits}
            valeur={droit}
            Icone={ICONES_DROITS[droit]}
            libelle={textes.nomsDroits[droit]}
            estCoche={droits.includes(droit)}
            onBasculer={() => basculer(droit)}
          />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Connexion de l'employé autorisé : identifiant et mot de passe provisoire = matricule ; en
 * modification, état du compte et remise du matricule comme mot de passe.
 */
function CompteEmploye({ estModification, compte }: { estModification: boolean; compte: EmployeDetail["compte"] }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-bordure bg-fond p-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-marine">
        <KeyRound className="size-5 text-primaire" aria-hidden="true" />
        {textes.compte}
      </h3>
      {compte ? (
        <p className="text-sm font-medium text-texte">
          {textes.compteActif(compte.identifiant)}
          {compte.motDePasseProvisoire && <span className="font-normal text-texte-secondaire"> · {textes.compteProvisoire}</span>}
        </p>
      ) : (
        <p className="text-sm font-medium text-texte">{textes.compteACreer}</p>
      )}
      {estModification && compte && (
        <CaseACocher nom={CHAMPS_ACCES.reinitialiserMotDePasse} libelle={textes.reinitialiser} />
      )}
    </section>
  );
}

/** Onglet « Pointage à distance » : autorisation, compte de connexion, appareils permis et conditions exigées. */
export function ChampsPointageDistance({
  valeurs,
  erreurs,
  estModification,
  compte,
}: {
  valeurs: Record<string, string>;
  erreurs?: Record<string, string | undefined>;
  estModification: boolean;
  compte: EmployeDetail["compte"];
}) {
  const [estAutorise, setEstAutorise] = useState(valeurs[CHAMPS_ACCES.pointageDistance] === "oui");
  const [appareils, setAppareils] = useState<AppareilPointage[]>(() => texteVersAppareils(valeurs[CHAMPS_ACCES.appareils] ?? ""));
  const basculer = (appareil: AppareilPointage) =>
    setAppareils((actuels) => (actuels.includes(appareil) ? actuels.filter((element) => element !== appareil) : [...actuels, appareil]));

  return (
    <div className="flex flex-col gap-5">
      <CaseACocher nom={CHAMPS_ACCES.pointageDistance} libelle={textes.autoriser} checked={estAutorise} onChange={(e) => setEstAutorise(e.target.checked)} />
      <MessageErreur message={erreurs?.[CHAMPS_ACCES.pointageDistance]} />

      {estAutorise ? (
        <>
          <CompteEmploye estModification={estModification} compte={compte} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-texte">{textes.appareils} *</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {APPAREILS_POINTAGE.map((appareil) => (
                <CarteCochable
                  key={appareil}
                  nom={CHAMPS_ACCES.appareils}
                  valeur={appareil}
                  Icone={ICONES[appareil]}
                  libelle={textes.nomsAppareils[appareil]}
                  estCoche={appareils.includes(appareil)}
                  onBasculer={() => basculer(appareil)}
                />
              ))}
            </div>
            <MessageErreur message={erreurs?.[CHAMPS_ACCES.appareils]} />
          </fieldset>
          <ChoixDroits valeurInitiale={valeurs[CHAMPS_ACCES.droits] ?? ""} />
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium text-texte">{textes.conditions}</legend>
            <CaseACocher nom={CHAMPS_ACCES.exigePosition} libelle={textes.exigePosition} defaultChecked={valeurs[CHAMPS_ACCES.exigePosition] === "oui"} />
            <CaseACocher nom={CHAMPS_ACCES.exigePhoto} libelle={textes.exigePhoto} defaultChecked={valeurs[CHAMPS_ACCES.exigePhoto] === "oui"} />
          </fieldset>
        </>
      ) : (
        <p className="rounded-lg bg-fond px-3 py-2.5 text-sm text-texte-secondaire">{textes.nonAutorise}</p>
      )}
    </div>
  );
}
