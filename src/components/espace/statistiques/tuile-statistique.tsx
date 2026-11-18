import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Chiffre clé : libellé, valeur en grand, précision dessous ; l'icône et le libellé portent le sens, jamais la couleur seule. */
export function TuileStatistique({ libelle, valeur, detail, Icone, teinte }: { libelle: string; valeur: string; detail: string; Icone: LucideIcon; teinte: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-bordure bg-surface p-4 shadow-carte">
      <span className="flex items-start justify-between gap-2 text-sm font-medium text-texte-secondaire">
        {libelle}
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", teinte)}>
          <Icone className="size-4" aria-hidden="true" />
        </span>
      </span>
      <span className="text-3xl font-bold tracking-tight text-marine">{valeur}</span>
      <span className="text-sm text-texte-secondaire">{detail}</span>
    </div>
  );
}
