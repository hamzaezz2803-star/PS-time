import { CalendarDays, CircleCheck, Repeat, type LucideIcon } from "lucide-react";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { TYPES_ROTATION } from "@/lib/constantes";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { champJour } from "@/lib/validation/rotation";
import { cn } from "@/lib/utils";

const textes = TEXTES_PROGRAMME.rotations;
type TypeRotation = (typeof TYPES_ROTATION)[number];

const ICONES_TYPE: Record<TypeRotation, LucideIcon> = { hebdomadaire: CalendarDays, cycle: Repeat };
const AIDES_TYPE: Record<TypeRotation, string> = { hebdomadaire: textes.aideHebdomadaire, cycle: textes.aideCycle };

/** Choix du type de rotation, en deux cartes cliquables (boutons radio). */
export function ChoixTypeRotation({ type, onChange }: { type: TypeRotation; onChange: (type: TypeRotation) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-texte">{textes.type}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TYPES_ROTATION.map((valeur) => {
          const Icone = ICONES_TYPE[valeur];
          const estChoisi = type === valeur;
          return (
            <label
              key={valeur}
              className={cn(
                "relative flex cursor-pointer gap-3 rounded-lg border p-4 transition-[background-color,border-color,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primaire",
                estChoisi ? "border-primaire bg-ciel/60 shadow-carte ring-1 ring-primaire" : "border-bordure hover:border-bordure-champ hover:bg-fond",
              )}
            >
              <input type="radio" name="type" value={valeur} checked={estChoisi} onChange={() => onChange(valeur)} className="sr-only" />
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", estChoisi ? "bg-primaire text-white" : "bg-canevas text-texte-secondaire")}>
                <Icone className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-1 flex-col gap-0.5 pe-6">
                <span className="text-base font-semibold text-texte">{textes.types[valeur]}</span>
                <span className="text-sm text-texte-secondaire">{AIDES_TYPE[valeur]}</span>
              </span>
              {estChoisi && <CircleCheck className="absolute end-3 top-3 size-5 text-primaire" aria-hidden="true" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Une liste déroulante par jour : un profil horaire, ou « Repos » (aucun profil). */
export function PlanningRotation({
  type,
  nombreJours,
  options,
  valeurJour,
}: {
  type: TypeRotation;
  nombreJours: number;
  options: OptionSelection[];
  valeurJour: (numero: number) => string;
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {Array.from({ length: nombreJours }, (_, numero) => {
        const id = champJour(numero);
        const libelle = type === "hebdomadaire" ? textes.joursSemaine[numero] : textes.jour(numero + 1);
        return (
          <li key={numero} className="flex items-center gap-3 rounded-lg border border-bordure bg-fond/60 p-2 ps-2.5 transition-colors duration-150 focus-within:border-primaire focus-within:bg-surface hover:bg-surface">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface text-sm font-semibold tabular-nums text-marine ring-1 ring-bordure" aria-hidden="true">
              {numero + 1}
            </span>
            <label htmlFor={id} className="w-20 shrink-0 text-sm font-medium text-texte">{libelle}</label>
            <select
              id={id}
              name={id}
              defaultValue={valeurJour(numero)}
              className="h-11 min-w-0 flex-1 cursor-pointer rounded-md border border-bordure-champ bg-surface px-2.5 text-base text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:h-9"
            >
              <option value="">{textes.repos}</option>
              {options.map((option) => (
                <option key={option.valeur} value={option.valeur}>{option.libelle}</option>
              ))}
            </select>
          </li>
        );
      })}
    </ul>
  );
}
