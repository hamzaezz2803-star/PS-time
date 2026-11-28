"use client";

import { useRef, type RefObject } from "react";
import { CircleCheck, CircleAlert } from "lucide-react";
import { colorerFormule, type TypeMorceau } from "@/lib/metier/formules/coloration";
import { FORMULE_LONGUEUR_MAX } from "@/lib/constantes";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { cn } from "@/lib/utils";

/** Couleur de chaque morceau ; seule la couleur change, pour que le texte coloré reste aligné sous le curseur. */
const COULEURS: Record<TypeMorceau, string> = {
  texte: "text-texte",
  nombre: "text-succes",
  variable: "text-primaire",
  variable_inconnue: "text-erreur underline decoration-wavy decoration-erreur/60",
  fonction: "text-marine underline decoration-marine/25",
  mot_cle: "text-attention",
  operateur: "text-texte-secondaire",
  invalide: "bg-erreur/15 text-erreur",
};

// Mêmes dimensions de texte pour la zone de saisie et le texte coloré placé dessous.
const TEXTE_COMMUN = "whitespace-pre-wrap break-words px-3.5 py-3 font-mono text-[15px] leading-6";

/**
 * Zone de saisie de formule avec coloration : le texte coloré est dessiné sous une zone de
 * saisie transparente. État de validation annoncé aux lecteurs d'écran.
 */
export function EditeurFormule({
  valeur,
  onChange,
  variablesConnues,
  erreur,
  zoneRef,
  estVerifiable,
}: {
  valeur: string;
  onChange: (valeur: string) => void;
  variablesConnues: ReadonlySet<string>;
  erreur: string | null;
  zoneRef: RefObject<HTMLTextAreaElement | null>;
  /** Faux tant qu'aucune périodicité n'est cochée. */
  estVerifiable: boolean;
}) {
  const fond = useRef<HTMLPreElement>(null);
  const aligner = () => {
    if (fond.current && zoneRef.current) fond.current.scrollTop = zoneRef.current.scrollTop;
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="formule" className="text-sm font-medium text-texte">{textes.formule}</label>
      <div className="relative min-h-32 overflow-hidden rounded-lg border border-bordure-champ bg-surface shadow-[0_1px_2px_rgb(15_27_51/0.04)] focus-within:border-primaire focus-within:outline-2 focus-within:outline-primaire has-aria-invalid:border-erreur">
        <pre ref={fond} aria-hidden="true" className={cn(TEXTE_COMMUN, "pointer-events-none absolute inset-0 m-0 overflow-hidden")}>
          {colorerFormule(valeur, variablesConnues).map((morceau, index) => (
            <span key={index} className={COULEURS[morceau.type]}>{morceau.texte}</span>
          ))}
          {/* Une ligne vide finale garde la même hauteur que la zone de saisie. */}
          {"\n"}
        </pre>
        <textarea
          ref={zoneRef}
          id="formule"
          name="formule"
          value={valeur}
          onChange={(evenement) => onChange(evenement.target.value)}
          onScroll={aligner}
          rows={4}
          maxLength={FORMULE_LONGUEUR_MAX}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder={textes.exempleFormule}
          aria-invalid={erreur ? true : undefined}
          aria-describedby="etat-formule"
          className={cn(TEXTE_COMMUN, "relative block min-h-32 w-full resize-y bg-transparent text-transparent caret-texte outline-none placeholder:text-texte-secondaire selection:bg-primaire/20")}
        />
      </div>
      <p id="etat-formule" aria-live="polite" className={cn("flex items-start gap-2 text-sm", erreur ? "text-erreur" : "text-succes")}>
        {!estVerifiable ? (
          <span className="text-texte-secondaire">{textes.choisirPeriodicite}</span>
        ) : valeur.trim() === "" && !erreur ? null : erreur ? (
          <>
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {erreur}
          </>
        ) : (
          <>
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {textes.formuleValide}
          </>
        )}
      </p>
    </div>
  );
}
