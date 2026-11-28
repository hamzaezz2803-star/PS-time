"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { DOIGTS, DOIGTS_CONSEILLES, type Doigt } from "@/lib/constantes";
import { decrireDoigt, normaliserDoigts, texteVersDoigts } from "@/lib/metier/acces-pointage";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { cn } from "@/lib/utils";
import { CHAMPS_ACCES } from "@/lib/validation/acces-pointage";
import { nomDoigt } from "./nom-doigt";

const textes = TEXTES_PERSONNES.acces;
/** Hauteur de chaque doigt, du pouce (rang 0) à l'auriculaire (rang 4), pour dessiner une main. */
const HAUTEURS = ["h-14", "h-24", "h-28", "h-24", "h-20"] as const;

/** Une main vue de dessus : les doigts dans l'ordre des badgeuses (gauche 0 à 4, droite 5 à 9). */
function Main({ titre, doigts, choisis, onBasculer }: { titre: string; doigts: readonly Doigt[]; choisis: Doigt[]; onBasculer: (doigt: Doigt) => void }) {
  return (
    <fieldset className="flex flex-col items-center gap-2 rounded-xl border border-bordure bg-fond/60 p-4">
      <legend className="sr-only">{titre}</legend>
      <div className="flex items-end gap-1.5">
        {doigts.map((doigt) => {
          const estChoisi = choisis.includes(doigt);
          const { rang } = decrireDoigt(doigt);
          return (
            <label
              key={doigt}
              title={nomDoigt(doigt)}
              className={cn(
                "flex w-9 cursor-pointer items-start justify-center rounded-t-lg border-2 pt-2 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primaire",
                HAUTEURS[rang],
                rang === 0 && "self-center",
                estChoisi ? "border-primaire bg-primaire text-white" : "border-bordure-champ bg-surface text-texte-secondaire hover:border-primaire hover:bg-ciel",
              )}
            >
              <input type="checkbox" name={CHAMPS_ACCES.doigts} value={doigt} checked={estChoisi} onChange={() => onBasculer(doigt)} className="sr-only" aria-label={nomDoigt(doigt)} />
              {estChoisi && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
            </label>
          );
        })}
      </div>
      <div className="h-12 w-48 rounded-b-2xl rounded-t-md border-2 border-bordure-champ bg-surface" aria-hidden="true" />
      <p className="text-sm font-medium text-texte">{titre}</p>
    </fieldset>
  );
}

/** Choix des doigts à enrôler sur la badgeuse : deux mains cliquables et la liste des doigts choisis. */
export function ChoixDoigts({ valeurInitiale }: { valeurInitiale: string }) {
  const [choisis, setChoisis] = useState<Doigt[]>(() => texteVersDoigts(valeurInitiale));
  const basculer = (doigt: Doigt) =>
    setChoisis((actuels) => normaliserDoigts(actuels.includes(doigt) ? actuels.filter((element) => element !== doigt) : [...actuels, doigt]));

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-marine">{textes.empreintes}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Main titre={textes.mainGauche} doigts={DOIGTS.slice(0, 5)} choisis={choisis} onBasculer={basculer} />
        <Main titre={textes.mainDroite} doigts={DOIGTS.slice(5)} choisis={choisis} onBasculer={basculer} />
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className={cn("text-sm font-semibold", choisis.length >= DOIGTS_CONSEILLES ? "text-succes" : "text-texte")}>{textes.nombreDoigts(choisis.length)}</span>
        {choisis.map((doigt) => (
          <span key={doigt} className="rounded-md bg-ciel px-2 py-0.5 text-sm font-medium text-marine ring-1 ring-inset ring-primaire/15">{nomDoigt(doigt)}</span>
        ))}
        {choisis.length > 0 && (
          <button type="button" onClick={() => setChoisis([])} className="min-h-11 rounded-md px-2 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9">
            {textes.toutEffacer}
          </button>
        )}
      </div>
    </section>
  );
}
