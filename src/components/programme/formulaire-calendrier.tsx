"use client";

import { useState } from "react";
import { Clock, MoonStar } from "lucide-react";
import { enregistrerCalendrier } from "@/app/(connecte)/programme/calendriers/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import {
  caseSaisie,
  useFormulaireListe,
  valeurSaisie,
  type EtatFormulaireListe,
} from "@/components/liste/utiliser-formulaire-liste";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { CALENDRIER_PAR_DEFAUT, LONGUEUR_MAX_NOM_PROGRAMME, PAUSE_MAX_MINUTES } from "@/lib/constantes";
import { dureeTravailMinutes, finLeLendemain, formaterDuree, heureVersMinutes, minutesVersHeure } from "@/lib/metier/programme";
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
  const [pause, setPause] = useState(valeur("pauseMinutes"));
  const erreurs = etat.erreursChamps;

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
        <div className="grid gap-4 sm:grid-cols-3">
          <ChampFormulaire nom="debutMinutes" libelle={textes.debut} type="time" value={debut} onChange={(e) => setDebut(e.target.value)} className="tabular-nums" required erreur={erreurs?.debutMinutes} />
          <ChampFormulaire nom="finMinutes" libelle={textes.fin} type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="tabular-nums" required erreur={erreurs?.finMinutes} />
          <ChampFormulaire
            nom="pauseMinutes"
            libelle={textes.pause}
            type="number"
            inputMode="numeric"
            min={0}
            max={PAUSE_MAX_MINUTES}
            step={1}
            value={pause}
            onChange={(e) => setPause(e.target.value)}
            className="tabular-nums"
            erreur={erreurs?.pauseMinutes}
          />
        </div>
        <ResumeHoraires debut={debut} fin={fin} pause={pause} />
      </SectionFormulaire>
      <ChampsPointageCalendrier valeur={valeur} cocher={(nom) => caseSaisie(etat, nom, initial[nom])} erreurs={erreurs} />
    </div>
  );
}

/** Temps de travail calculé en direct, avec la mention « lendemain » pour un service de nuit. */
function ResumeHoraires({ debut, fin, pause }: { debut: string; fin: string; pause: string }) {
  const minutesDebut = heureVersMinutes(debut);
  const minutesFin = heureVersMinutes(fin);
  const minutesPause = /^\d+$/.test(pause.trim()) ? Number(pause) : 0;
  if (minutesDebut === null || minutesFin === null || minutesDebut === minutesFin) return null;
  const estDeNuit = finLeLendemain(minutesDebut, minutesFin);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-bordure bg-fond px-4 py-3" aria-live="polite">
      <p className="text-sm text-texte-secondaire">
        {textes.tempsTravail}
        <span className="ms-2 text-base font-semibold tabular-nums text-marine">
          {formaterDuree(dureeTravailMinutes(minutesDebut, minutesFin, minutesPause))}
        </span>
      </p>
      {estDeNuit && (
        <p className="flex items-center gap-1.5 text-sm text-texte-secondaire">
          <MoonStar className="size-4 text-primaire" aria-hidden="true" />
          {textes.finLendemain}
        </p>
      )}
    </div>
  );
}
