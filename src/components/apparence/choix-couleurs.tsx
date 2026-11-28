"use client";

import { useState } from "react";
import { CircleCheck, RotateCcw, TriangleAlert } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { COULEURS_PERSONNALISABLES, CONTRASTE_MIN_TEXTE } from "@/lib/constantes";
import { cleCouleur } from "@/lib/metier/apparence";
import { controlerContrastes, normaliserCouleur, type ControleContraste, type CouleurPersonnalisable, type CouleursPersonnalisees } from "@/lib/metier/couleurs";
import { TEXTES_APPARENCE as textes } from "@/lib/textes/apparence";
import { cn } from "@/lib/utils";

const CHAMP_CODE =
  "h-11 w-28 rounded-lg border border-bordure-champ bg-surface px-3 font-mono text-base text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:h-10";

/** Lisibilité calculée en direct (le serveur refait le même contrôle à l'enregistrement). */
function Lisibilite({ controle }: { controle: ControleContraste }) {
  if (controle.couleur === "accent") return <p className="text-sm text-texte-secondaire">{textes.decoratif}</p>;
  const Icone = controle.estLisible ? CircleCheck : TriangleAlert;
  return (
    <p className={cn("flex items-start gap-1.5 text-sm", controle.estLisible ? "text-succes" : "text-erreur")}>
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {controle.estLisible ? textes.lisible(controle.ratio) : textes.erreurs.contraste(controle.couleur, controle.ratio, CONTRASTE_MIN_TEXTE)}
    </p>
  );
}

function LigneCouleur({ couleur, valeur, controle, erreur, onChange }: {
  couleur: CouleurPersonnalisable;
  valeur: string;
  controle: ControleContraste;
  erreur?: string;
  onChange: (valeur: string) => void;
}) {
  const id = cleCouleur(couleur);
  // Code saisi à la main : suit la palette, et ne change la couleur que lorsqu'il est complet.
  const [brouillon, setBrouillon] = useState(valeur);
  const [derniereValeur, setDerniereValeur] = useState(valeur);
  if (valeur !== derniereValeur) {
    setDerniereValeur(valeur);
    setBrouillon(valeur);
  }
  return (
    <div className="flex flex-col gap-2 border-t border-bordure py-4 first:border-t-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex flex-1 flex-col">
        <label htmlFor={id} className="text-base font-semibold text-texte">{textes.couleurs[couleur].libelle}</label>
        <span className="text-sm text-texte-secondaire">{textes.couleurs[couleur].detail}</span>
        <Lisibilite controle={controle} />
        {/* Message du serveur seulement s'il diffère du contrôle en direct déjà affiché. */}
        {erreur && controle.estLisible && <MessageErreur message={erreur} />}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id={id}
          name={id}
          value={valeur}
          onChange={(evenement) => onChange(evenement.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-bordure-champ bg-surface p-1 focus-visible:outline-2 focus-visible:outline-primaire lg:h-10"
        />
        <input
          type="text"
          value={brouillon}
          aria-label={textes.codeCouleur(textes.couleurs[couleur].libelle)}
          maxLength={7}
          spellCheck={false}
          autoCapitalize="none"
          onChange={(evenement) => {
            setBrouillon(evenement.target.value);
            const lue = normaliserCouleur(evenement.target.value);
            if (lue) onChange(lue);
          }}
          className={CHAMP_CODE}
        />
      </div>
    </div>
  );
}

/** Les quatre couleurs du thème personnalisé, avec leur lisibilité en direct. */
export function ChoixCouleurs({ couleurs, erreurs, onChange, onReinitialiser }: {
  couleurs: CouleursPersonnalisees;
  erreurs?: Partial<Record<string, string>>;
  onChange: (couleur: CouleurPersonnalisable, valeur: string) => void;
  onReinitialiser: () => void;
}) {
  const controles = controlerContrastes(couleurs);
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5">
      <legend className="sr-only">{textes.titreCouleurs}</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-base font-semibold text-marine" aria-hidden="true">{textes.titreCouleurs}</p>
        <Bouton variante="fantome" onClick={onReinitialiser} className="shrink-0">
          <RotateCcw className="size-4" aria-hidden="true" />
          {textes.reinitialiserCouleurs}
        </Bouton>
      </div>
      <div>
        {COULEURS_PERSONNALISABLES.map((couleur) => (
          <LigneCouleur
            key={couleur}
            couleur={couleur}
            valeur={couleurs[couleur]}
            controle={controles.find((controle) => controle.couleur === couleur) ?? { couleur, ratio: 0, estLisible: false }}
            erreur={erreurs?.[cleCouleur(couleur)]}
            onChange={(valeur) => onChange(couleur, valeur)}
          />
        ))}
      </div>
      <MessageErreur message={erreurs?.couleurs} />
    </fieldset>
  );
}
