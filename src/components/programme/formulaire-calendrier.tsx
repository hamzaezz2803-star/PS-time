"use client";

import { useState } from "react";
import { Clock, Coffee, MoonStar } from "lucide-react";
import { enregistrerCalendrier } from "@/app/(connecte)/programme/calendriers/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import {
  caseSaisie,
  useFormulaireListe,
  valeurSaisie,
  type EtatFormulaireListe,
} from "@/components/liste/utiliser-formulaire-liste";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { CALENDRIER_PAR_DEFAUT, LONGUEUR_MAX_NOM_PROGRAMME } from "@/lib/constantes";
import {
  dureePauseMinutes,
  dureeTravailMinutes,
  finLeLendemain,
  formaterDuree,
  heureVersMinutes,
  minutesVersHeure,
} from "@/lib/metier/programme";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { Calendrier } from "@/types";
import { ChampsPointageCalendrier } from "./champs-pointage-calendrier";
import { SectionFormulaire } from "./section-formulaire";

const textes = TEXTES_PROGRAMME.calendriers;

/** Création (sans `element`) ou modification d'un calendrier : horaires, pointage, heures supplémentaires. */
export function FormulaireCalendrier({ element, onTermine, onAnnuler }: ProprietesFormulaireListe<Calendrier>) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerCalendrier, onTermine);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <ContenuCalendrier key={etat.numeroReponse} etat={etat} calendrier={element} />
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

function ContenuCalendrier({ etat, calendrier }: { etat: EtatFormulaireListe; calendrier?: Calendrier }) {
  const initial = calendrier ?? CALENDRIER_PAR_DEFAUT;
  const valeur = (nom: keyof typeof CALENDRIER_PAR_DEFAUT) => valeurSaisie(etat, nom, String(initial[nom]));
  const [debut, setDebut] = useState(valeurSaisie(etat, "debutMinutes", minutesVersHeure(initial.debutMinutes)));
  const [fin, setFin] = useState(valeurSaisie(etat, "finMinutes", minutesVersHeure(initial.finMinutes)));
  const heureInitiale = (minutes: number | null) => (minutes === null ? "" : minutesVersHeure(minutes));
  const [debutPause, setDebutPause] = useState(valeurSaisie(etat, "pauseDebutMinutes", heureInitiale(initial.pauseDebutMinutes)));
  const [finPause, setFinPause] = useState(valeurSaisie(etat, "pauseFinMinutes", heureInitiale(initial.pauseFinMinutes)));
  const erreurs = etat.erreursChamps;
  const aUnePause = debutPause !== "" || finPause !== "";

  return (
    <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-5 sm:px-6">
      <SectionFormulaire titre={textes.sections.horaires} icone={Clock}>
        <ChampFormulaire
          nom="nom"
          libelle={textes.nom}
          defaultValue={valeurSaisie(etat, "nom", calendrier?.nom ?? "")}
          placeholder={textes.exempleNom}
          maxLength={LONGUEUR_MAX_NOM_PROGRAMME}
          autoComplete="off"
          required
          erreur={erreurs?.nom}
          data-focus-initial
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampFormulaire nom="debutMinutes" libelle={textes.debut} type="time" value={debut} onChange={(e) => setDebut(e.target.value)} className="tabular-nums" required erreur={erreurs?.debutMinutes} />
          <ChampFormulaire nom="finMinutes" libelle={textes.fin} type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="tabular-nums" required erreur={erreurs?.finMinutes} />
        </div>
        <fieldset className="flex flex-col gap-3 rounded-lg border border-bordure p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-texte">
            <Coffee className="size-4 text-primaire" aria-hidden="true" />
            {textes.pause}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <ChampFormulaire nom="pauseDebutMinutes" libelle={textes.pauseDebut} type="time" value={debutPause} onChange={(e) => setDebutPause(e.target.value)} className="tabular-nums" erreur={erreurs?.pauseDebutMinutes} />
            <ChampFormulaire nom="pauseFinMinutes" libelle={textes.pauseFin} type="time" value={finPause} onChange={(e) => setFinPause(e.target.value)} className="tabular-nums" erreur={erreurs?.pauseFinMinutes} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-texte-secondaire">{textes.aidePause}</p>
            {aUnePause && (
              <Bouton type="button" variante="fantome" onClick={() => { setDebutPause(""); setFinPause(""); }}>
                {textes.retirerPause}
              </Bouton>
            )}
          </div>
        </fieldset>
        <ResumeHoraires debut={debut} fin={fin} debutPause={debutPause} finPause={finPause} />
      </SectionFormulaire>
      <ChampsPointageCalendrier valeur={valeur} cocher={(nom) => caseSaisie(etat, nom, initial[nom])} erreurs={erreurs} />
    </div>
  );
}

/** Temps de travail calculé en direct, avec la mention « lendemain » pour un service de nuit. */
function ResumeHoraires({ debut, fin, debutPause, finPause }: { debut: string; fin: string; debutPause: string; finPause: string }) {
  const minutesDebut = heureVersMinutes(debut);
  const minutesFin = heureVersMinutes(fin);
  if (minutesDebut === null || minutesFin === null || minutesDebut === minutesFin) return null;
  const minutesPause = dureePauseMinutes(heureVersMinutes(debutPause), heureVersMinutes(finPause));
  const estDeNuit = finLeLendemain(minutesDebut, minutesFin);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-bordure bg-fond px-4 py-3" aria-live="polite">
      <p className="text-sm text-texte-secondaire">
        {textes.tempsTravail}
        <span className="ms-2 text-base font-semibold tabular-nums text-marine">
          {formaterDuree(dureeTravailMinutes(minutesDebut, minutesFin, minutesPause))}
        </span>
      </p>
      {minutesPause > 0 && (
        <p className="text-sm text-texte-secondaire">
          {textes.pause} {textes.plagePause(debutPause, finPause)}
          <span className="ms-1 tabular-nums">({formaterDuree(minutesPause)})</span>
        </p>
      )}
      {estDeNuit && (
        <p className="flex items-center gap-1.5 text-sm text-texte-secondaire">
          <MoonStar className="size-4 text-primaire" aria-hidden="true" />
          {textes.finLendemain}
        </p>
      )}
    </div>
  );
}
