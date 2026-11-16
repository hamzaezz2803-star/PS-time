"use client";

import { useState } from "react";
import { Eraser, Plus, Sparkles, Trash2 } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PLAGES_PAR_PROFIL_MAX } from "@/lib/constantes";
import { formaterDuree, minutesVersHeure, MINUTES_PAR_JOUR } from "@/lib/metier/programme";
import { PLAGES_JOURNEE_TYPE, TYPES_PLAGE, theoriqueMinutes, type Plage, type TypePlage } from "@/lib/metier/profil-horaire";
import { TEXTES_PROFILS } from "@/lib/textes/profils-horaires";
import { heureDePlage } from "@/lib/validation/profil-horaire";
import { BarreJournee, COULEURS_PLAGE, LegendePlages } from "./barre-journee";
import { cn } from "@/lib/utils";

const { champs, typesPlage } = TEXTES_PROFILS;
const CHAMP =
  "h-11 rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:h-10";

/** Une ligne saisie : fin de la plage (texte HH:MM) et type ; le début est la fin précédente. */
export type LignePlage = { fin: string; type: TypePlage };

export const versLignes = (plages: Plage[]): LignePlage[] => plages.map((plage) => ({ fin: minutesVersHeure(plage.fin), type: plage.type }));

/** Plages lisibles pour l'aperçu (les lignes encore mal saisies sont ignorées). */
function versPlages(lignes: LignePlage[]): Plage[] {
  const plages: Plage[] = [];
  let debut = 0;
  for (const ligne of lignes) {
    const fin = heureDePlage(ligne.fin);
    if (fin === null || fin <= debut) break;
    plages.push({ debut, fin, type: ligne.type });
    debut = fin;
  }
  return plages;
}

/**
 * Découpage de la journée en plages : une ligne par plage (fin et type), aperçu en direct sur
 * une barre de 24 h et temps théorique calculé. Les champs sont envoyés tels quels au serveur.
 */
export function EditeurPlages({ initiales, erreur }: { initiales: LignePlage[]; erreur?: string }) {
  const [lignes, setLignes] = useState<LignePlage[]>(initiales);
  const plages = versPlages(lignes);
  const debuts = [0, ...plages.map((plage) => plage.fin)];

  const changer = (rang: number, modification: Partial<LignePlage>) =>
    setLignes((actuelles) => actuelles.map((ligne, i) => (i === rang ? { ...ligne, ...modification } : ligne)));
  const ajouter = () =>
    setLignes((actuelles) => [...actuelles, { fin: minutesVersHeure(MINUTES_PAR_JOUR), type: "interdite" }]);
  const retirer = (rang: number) => setLignes((actuelles) => actuelles.filter((_, i) => i !== rang));

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby="aide-plages">
      <legend className="text-base font-semibold text-marine">{champs.plages}</legend>
      <p id="aide-plages" className="text-sm text-texte-secondaire">{champs.aidePlages}</p>

      <div className="rounded-xl border border-bordure bg-fond p-4">
        <BarreJournee plages={plages} avecReperes />
        <p className="mt-3 flex items-baseline justify-between gap-3 text-sm">
          <span className="text-texte-secondaire">{champs.theorique}</span>
          <span className="text-lg font-semibold tabular-nums text-marine">{formaterDuree(theoriqueMinutes(plages))}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Bouton variante="contour" onClick={() => setLignes(versLignes(PLAGES_JOURNEE_TYPE))}>
          <Sparkles className="size-4" aria-hidden="true" />
          {champs.modele}
        </Bouton>
        <Bouton variante="fantome" onClick={() => setLignes([{ fin: "24:00", type: "fixe" }])}>
          <Eraser className="size-4" aria-hidden="true" />
          {champs.effacer}
        </Bouton>
      </div>

      <ol className="flex flex-col gap-2">
        {lignes.map((ligne, rang) => (
          <li key={rang} className="flex flex-wrap items-center gap-2 rounded-lg border border-bordure bg-surface p-2 sm:flex-nowrap">
            <span className={cn("h-9 w-1.5 shrink-0 rounded-full", COULEURS_PLAGE[ligne.type])} aria-hidden="true" />
            <span className="w-14 shrink-0 text-base tabular-nums text-texte-secondaire">{minutesVersHeure(debuts[rang] ?? 0)}</span>
            <span className="text-texte-secondaire" aria-hidden="true">→</span>
            <input
              name="plageFin"
              aria-label={`${champs.fin} ${rang + 1}`}
              value={ligne.fin}
              onChange={(evenement) => changer(rang, { fin: evenement.target.value })}
              inputMode="numeric"
              placeholder="HH:MM"
              maxLength={5}
              className={cn(CHAMP, "w-24 tabular-nums")}
            />
            <select
              name="plageType"
              aria-label={`${champs.typePlage} ${rang + 1}`}
              value={ligne.type}
              onChange={(evenement) => changer(rang, { type: evenement.target.value as TypePlage })}
              className={cn(CHAMP, "min-w-0 flex-1")}
            >
              {TYPES_PLAGE.map((type) => (
                <option key={type} value={type}>{typesPlage[type].libelle}</option>
              ))}
            </select>
            <BoutonIcone libelle={champs.retirerPlage(rang + 1)} Icone={Trash2} onClick={() => retirer(rang)} estDanger />
          </li>
        ))}
      </ol>
      {lignes.length < PLAGES_PAR_PROFIL_MAX && (
        <Bouton variante="contour" onClick={ajouter} className="w-fit">
          <Plus className="size-4" aria-hidden="true" />
          {champs.ajouterPlage}
        </Bouton>
      )}
      <MessageErreur message={erreur} />

      <details className="rounded-lg border border-bordure p-3">
        <summary className="cursor-pointer text-sm font-medium text-marine">{champs.legende}</summary>
        <div className="mt-3"><LegendePlages /></div>
      </details>
    </fieldset>
  );
}
