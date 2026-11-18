"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { modifierApparence } from "@/app/(connecte)/administration/apparence/actions";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { POLICES, THEMES } from "@/lib/constantes";
import type { Apparence } from "@/lib/metier/apparence";
import { TEXTES_APPARENCE as textes } from "@/lib/textes/apparence";
import { cn } from "@/lib/utils";
import type { EtatFormulaire } from "@/types";

const ETAT_INITIAL: EtatFormulaire = {};

/** Carte d'un choix (bouton radio caché) : bordure épaisse et coche quand elle est choisie, jamais la couleur seule. */
function CarteChoix({ nom, valeur, estChoisi, onChoisir, libelle, detail, estActuel, children }: {
  nom: string;
  valeur: string;
  estChoisi: boolean;
  onChoisir: () => void;
  libelle: string;
  detail: string;
  estActuel: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded-xl border bg-surface p-4 shadow-carte transition-shadow duration-150 hover:shadow-survol has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primaire",
        estChoisi ? "border-primaire ring-2 ring-primaire" : "border-bordure",
      )}
    >
      <input type="radio" name={nom} value={valeur} checked={estChoisi} onChange={onChoisir} className="sr-only" />
      {children}
      <span className="flex items-start justify-between gap-2">
        <span className="flex flex-col">
          <span className="flex flex-wrap items-center gap-2 text-base font-semibold text-texte">
            {libelle}
            {estActuel && <span className="rounded-md bg-canevas px-2 py-0.5 text-sm font-medium text-texte-secondaire">{textes.actuel}</span>}
          </span>
          <span className="text-sm text-texte-secondaire">{detail}</span>
        </span>
        {estChoisi && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primaire text-white">
            <Check className="size-4" aria-hidden="true" />
          </span>
        )}
      </span>
    </label>
  );
}

/** Aperçu d'une carte de l'application avec le thème et la police choisis (attributs lus par globals.css). */
function Apercu({ theme, police }: Apparence) {
  return (
    <div data-theme={theme} data-police={police} className="flex flex-col gap-3 rounded-xl border border-bordure bg-fond p-5 font-sans">
      <p className="text-sm font-semibold uppercase tracking-wider text-primaire">{textes.apercu}</p>
      <div className="flex flex-col gap-3 rounded-lg border border-bordure bg-surface p-4 shadow-carte">
        <p className="text-lg font-bold text-marine">{textes.exempleTitre}</p>
        <p className="text-base tabular-nums text-texte-secondaire">{textes.exempleTexte}</p>
        <span className="inline-flex h-10 w-fit items-center rounded-lg bg-primaire px-4 text-sm font-semibold text-white">{textes.exempleBouton}</span>
      </div>
    </div>
  );
}

/** Choix du thème de couleurs et de la police de toute l'application, avec aperçu en direct. */
export function FormulaireApparence({ actuelle }: { actuelle: Apparence }) {
  const [etat, action, enCours] = useActionState(modifierApparence, ETAT_INITIAL);
  const [choix, setChoix] = useState<Apparence>(actuelle);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-3" aria-describedby="aide-themes">
          <legend className="text-lg font-semibold text-marine">{textes.titreThemes}</legend>
          <p id="aide-themes" className="-mt-1 text-sm text-texte-secondaire">{textes.aideThemes}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {THEMES.map((theme) => (
              <CarteChoix
                key={theme}
                nom="theme"
                valeur={theme}
                estChoisi={choix.theme === theme}
                onChoisir={() => setChoix((actuel) => ({ ...actuel, theme }))}
                libelle={textes.themes[theme].libelle}
                detail={textes.themes[theme].detail}
                estActuel={actuelle.theme === theme}
              >
                {/* Les nuances viennent des variables du thème : aucune couleur écrite ici. */}
                <span data-theme={theme} className="flex h-10 overflow-hidden rounded-lg ring-1 ring-bordure" aria-hidden="true">
                  <span className="flex-[2] bg-marine" />
                  <span className="flex-[2] bg-primaire" />
                  <span className="flex-1 bg-accent" />
                  <span className="flex-[2] bg-ciel" />
                  <span className="flex-1 bg-fond" />
                </span>
              </CarteChoix>
            ))}
          </div>
          <MessageErreur message={etat.erreursChamps?.theme} />
        </fieldset>

        <fieldset className="flex flex-col gap-3" aria-describedby="aide-polices">
          <legend className="text-lg font-semibold text-marine">{textes.titrePolices}</legend>
          <p id="aide-polices" className="-mt-1 text-sm text-texte-secondaire">{textes.aidePolices}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {POLICES.map((police) => (
              <CarteChoix
                key={police}
                nom="police"
                valeur={police}
                estChoisi={choix.police === police}
                onChoisir={() => setChoix((actuel) => ({ ...actuel, police }))}
                libelle={textes.polices[police].libelle}
                detail={textes.polices[police].detail}
                estActuel={actuelle.police === police}
              >
                <span data-police={police} className="font-sans text-3xl font-semibold tabular-nums text-marine" aria-hidden="true">
                  {textes.exemplePolice}
                </span>
              </CarteChoix>
            ))}
          </div>
          <MessageErreur message={etat.erreursChamps?.police} />
        </fieldset>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Apercu {...choix} />
        <div role="alert" aria-live="polite" className="flex flex-col gap-2">
          <MessageErreur message={etat.message} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
          <MessageSucces message={etat.succes?.message} />
        </div>
        <Bouton type="submit" disabled={enCours}>
          {enCours && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {enCours ? textes.enregistrementEnCours : textes.enregistrer}
        </Bouton>
      </div>
    </form>
  );
}
