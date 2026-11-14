"use client";

import { useState } from "react";
import { enregistrerRotation } from "@/app/(connecte)/programme/rotations/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { useFormulaireListe, valeurSaisie, type EtatFormulaireListe } from "@/components/liste/utiliser-formulaire-liste";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { JOURS_PAR_SEMAINE, JOURS_ROTATION_MAX, LONGUEUR_MAX_NOM_PROGRAMME } from "@/lib/constantes";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { champJour } from "@/lib/validation/rotation";
import type { Rotation } from "@/types";
import { ChoixTypeRotation, PlanningRotation } from "./planning-rotation";

const textes = TEXTES_PROGRAMME.rotations;

/** Création (sans `element`) ou modification d'une rotation : type, durée et calendrier de chaque jour. */
export function FormulaireRotation({
  element,
  optionsCalendriers,
  onTermine,
  onAnnuler,
}: ProprietesFormulaireListe<Rotation> & { optionsCalendriers: OptionSelection[] }) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerRotation, onTermine);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <ContenuRotation key={etat.numeroReponse} etat={etat} rotation={element} options={optionsCalendriers} />
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

function ContenuRotation({ etat, rotation, options }: { etat: EtatFormulaireListe; rotation?: Rotation; options: OptionSelection[] }) {
  const [type, setType] = useState<Rotation["type"]>(
    valeurSaisie(etat, "type", rotation?.type ?? "hebdomadaire") === "cycle" ? "cycle" : "hebdomadaire",
  );
  const [saisieJours, setSaisieJours] = useState(valeurSaisie(etat, "nombreJours", String(rotation?.type === "cycle" ? rotation.nombreJours : JOURS_PAR_SEMAINE)));
  const nombreSaisi = Number(saisieJours);
  // Pendant la saisie, la grille reste affichée avec un nombre de jours valide.
  const nombreJours = type === "hebdomadaire" ? JOURS_PAR_SEMAINE : Number.isInteger(nombreSaisi) ? Math.min(Math.max(nombreSaisi, 1), JOURS_ROTATION_MAX) : 1;
  const erreurs = etat.erreursChamps;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
      <ChampFormulaire
        nom="nom"
        libelle={textes.nom}
        defaultValue={valeurSaisie(etat, "nom", rotation?.nom ?? "")}
        placeholder={textes.exempleNom}
        maxLength={LONGUEUR_MAX_NOM_PROGRAMME}
        autoComplete="off"
        required
        erreur={erreurs?.nom}
        data-focus-initial
      />
      <ChoixTypeRotation type={type} onChange={setType} />
      <MessageErreur message={erreurs?.type} />
      {type === "cycle" && (
        <ChampFormulaire
          nom="nombreJours"
          libelle={textes.nombreJours}
          type="number"
          inputMode="numeric"
          min={1}
          max={JOURS_ROTATION_MAX}
          step={1}
          value={saisieJours}
          onChange={(e) => setSaisieJours(e.target.value)}
          className="tabular-nums sm:max-w-40"
          erreur={erreurs?.nombreJours}
        />
      )}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold text-marine">{textes.planning}</legend>
        {options.length === 0 ? (
          <p className="rounded-lg border border-bordure bg-fond p-4 text-sm text-texte-secondaire">{textes.aucunCalendrier}</p>
        ) : (
          <PlanningRotation
            type={type}
            nombreJours={nombreJours}
            options={options}
            valeurJour={(numero) => valeurSaisie(etat, champJour(numero), rotation?.jours[numero] ?? "")}
          />
        )}
        <MessageErreur message={erreurs?.jours} />
      </fieldset>
    </div>
  );
}
