import { CalendarDays, Repeat, type LucideIcon } from "lucide-react";
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
                "flex cursor-pointer gap-3 rounded-lg border p-3.5 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primaire",
                estChoisi ? "border-primaire bg-ciel/60" : "border-bordure hover:bg-fond",
              )}
            >
              <input type="radio" name="type" value={valeur} checked={estChoisi} onChange={() => onChange(valeur)} className="sr-only" />
              <Icone className={cn("mt-0.5 size-5 shrink-0", estChoisi ? "text-primaire" : "text-texte-secondaire")} aria-hidden="true" />
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-medium text-texte">{textes.types[valeur]}</span>
                <span className="text-sm text-texte-secondaire">{AIDES_TYPE[valeur]}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Une liste déroulante par jour : un calendrier, ou « Repos ». */
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
    <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
      {Array.from({ length: nombreJours }, (_, numero) => {
        const id = champJour(numero);
        const libelle = type === "hebdomadaire" ? textes.joursSemaine[numero] : textes.jour(numero + 1);
        return (
          <li key={numero} className="flex items-center gap-3 rounded-lg border border-bordure px-3 py-2">
            <label htmlFor={id} className="w-24 shrink-0 text-sm font-medium text-texte">{libelle}</label>
            <select
              id={id}
              name={id}
              defaultValue={valeurJour(numero)}
              className="h-11 min-w-0 flex-1 rounded-md border border-bordure-champ bg-surface px-2.5 text-base text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:h-9"
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
