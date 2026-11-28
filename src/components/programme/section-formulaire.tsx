import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { cn } from "@/lib/utils";

/** Section d'un formulaire du module Programme : titre avec icône, puis ses champs. */
export function SectionFormulaire({
  titre,
  icone: Icone,
  children,
  className,
}: {
  titre: string;
  icone: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-4", className)}>
      <legend className="mb-4 flex w-full items-center gap-2.5 border-b border-bordure pb-3 text-base font-semibold text-marine">
        <span className="flex size-8 items-center justify-center rounded-lg bg-ciel text-primaire">
          <Icone className="size-4" aria-hidden="true" />
        </span>
        {titre}
      </legend>
      {children}
    </fieldset>
  );
}

/** Champ numérique en minutes (entier positif borné). */
export function ChampMinutes({
  nom,
  libelle,
  valeur,
  maximum,
  erreur,
}: {
  nom: string;
  libelle: string;
  valeur: string;
  maximum: number;
  erreur?: string;
}) {
  return (
    <ChampFormulaire
      nom={nom}
      libelle={libelle}
      type="number"
      inputMode="numeric"
      min={0}
      max={maximum}
      step={1}
      defaultValue={valeur}
      className="tabular-nums"
      erreur={erreur}
    />
  );
}
