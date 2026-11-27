"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { modifierApparence } from "@/app/(connecte)/administration/apparence/actions";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { COULEURS_PERSONNALISABLES, COULEURS_PERSONNALISEES_PAR_DEFAUT, POLICES, TAILLES_TEXTE, THEMES } from "@/lib/constantes";
import { cleCouleur, type Apparence } from "@/lib/metier/apparence";
import { TEXTES_APPARENCE as textes } from "@/lib/textes/apparence";
import { cn } from "@/lib/utils";
import type { EtatFormulaire } from "@/types";
import { ApercuApparence, Nuancier } from "./apercu-apparence";
import { CarteChoix } from "./carte-choix";
import { ChoixAffichage } from "./choix-affichage";
import { ChoixCouleurs } from "./choix-couleurs";
import { Section } from "./section-apparence";

const ETAT_INITIAL: EtatFormulaire = {};
/** Taille de l'exemple « Aa » de chaque carte de taille du texte. */
const TAILLE_EXEMPLE = { normale: "text-2xl", grande: "text-3xl", tres_grande: "text-4xl" } as const;

/** Choix du thème (ou de couleurs libres), de la police, de la taille du texte et de l'affichage, avec aperçu en direct. */
export function FormulaireApparence({ actuelle }: { actuelle: Apparence }) {
  const [etat, action, enCours] = useActionState(modifierApparence, ETAT_INITIAL);
  const [choix, setChoix] = useState<Apparence>(actuelle);
  const changer = (partiel: Partial<Apparence>) => setChoix((actuel) => ({ ...actuel, ...partiel }));
  const erreurs = etat.erreursChamps;
  const estPersonnalise = choix.theme === "personnalise";

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-8">
        <Section id="themes" titre={textes.titreThemes} aide={textes.aideThemes} erreur={erreurs?.theme}>
          <div className="grid gap-4 sm:grid-cols-2">
            {THEMES.map((theme) => (
              <CarteChoix
                key={theme}
                nom="theme"
                valeur={theme}
                estChoisi={choix.theme === theme}
                onChoisir={() => changer({ theme })}
                libelle={textes.themes[theme].libelle}
                detail={textes.themes[theme].detail}
                estActuel={actuelle.theme === theme}
              >
                <Nuancier theme={theme} couleurs={choix.couleurs} />
              </CarteChoix>
            ))}
          </div>
          {estPersonnalise ? (
            <ChoixCouleurs
              couleurs={choix.couleurs}
              erreurs={erreurs}
              onChange={(couleur, valeur) => changer({ couleurs: { ...choix.couleurs, [couleur]: valeur } })}
              onReinitialiser={() => changer({ couleurs: { ...COULEURS_PERSONNALISEES_PAR_DEFAUT } })}
            />
          ) : (
            // Les couleurs personnalisées sont gardées telles quelles quand un thème tout prêt est choisi.
            COULEURS_PERSONNALISABLES.map((couleur) => (
              <input key={couleur} type="hidden" name={cleCouleur(couleur)} value={choix.couleurs[couleur]} />
            ))
          )}
        </Section>

        <Section id="polices" titre={textes.titrePolices} aide={textes.aidePolices} erreur={erreurs?.police}>
          <div className="grid gap-4 sm:grid-cols-2">
            {POLICES.map((police) => (
              <CarteChoix
                key={police}
                nom="police"
                valeur={police}
                estChoisi={choix.police === police}
                onChoisir={() => changer({ police })}
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
        </Section>

        <Section id="tailles" titre={textes.titreTaille} aide={textes.aideTaille} erreur={erreurs?.taille}>
          <div className="grid gap-4 sm:grid-cols-3">
            {TAILLES_TEXTE.map((taille) => (
              <CarteChoix
                key={taille}
                nom="taille"
                valeur={taille}
                estChoisi={choix.taille === taille}
                onChoisir={() => changer({ taille })}
                libelle={textes.tailles[taille].libelle}
                detail={textes.tailles[taille].detail}
                estActuel={actuelle.taille === taille}
              >
                <span data-police={choix.police} className={cn("font-sans font-semibold leading-none text-marine", TAILLE_EXEMPLE[taille])} aria-hidden="true">
                  {textes.exempleTaille}
                </span>
              </CarteChoix>
            ))}
          </div>
        </Section>

        <ChoixAffichage choix={choix} actuelle={actuelle} erreurs={erreurs} onChange={changer} />
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <ApercuApparence {...choix} />
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
