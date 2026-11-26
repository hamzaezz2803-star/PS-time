import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Teinte d'une tuile : fond et bordure légers, icône de la même couleur. */
export type TonTuile = "succes" | "attention" | "erreur" | "primaire" | "justifie";

const TONS: Record<TonTuile, { carte: string; icone: string }> = {
  succes: { carte: "border-succes/25 bg-succes/5", icone: "text-succes" },
  attention: { carte: "border-attention/25 bg-attention/5", icone: "text-attention" },
  erreur: { carte: "border-erreur/25 bg-erreur/5", icone: "text-erreur" },
  primaire: { carte: "border-primaire/20 bg-ciel/70", icone: "text-primaire" },
  justifie: { carte: "border-graphe-justifie/25 bg-graphe-justifie/5", icone: "text-graphe-justifie" },
};

/**
 * Chiffre clé : grande icône, valeur en grand, libellé et précision dessous. L'icône et le libellé
 * portent le sens, jamais la couleur seule. `visuel` (anneau, jauge) s'affiche à côté de l'icône ou
 * sous le texte (`visuelEnBas`).
 */
export function TuileStatistique({
  libelle,
  valeur,
  detail,
  Icone,
  ton,
  visuel,
  visuelEnBas = false,
  className,
}: {
  libelle: string;
  valeur: string;
  detail: string;
  Icone: LucideIcon;
  ton: TonTuile;
  visuel?: ReactNode;
  visuelEnBas?: boolean;
  className?: string;
}) {
  const teinte = TONS[ton];
  return (
    <div className={cn("flex flex-col rounded-xl border p-5 shadow-carte", teinte.carte, className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <Icone className={cn("size-9 shrink-0 stroke-[1.75]", teinte.icone)} aria-hidden="true" />
        {!visuelEnBas && visuel}
      </div>
      <span className="text-4xl font-semibold tracking-tight text-marine tabular-nums">{valeur}</span>
      <span className="mt-2 text-base font-medium text-texte">{libelle}</span>
      <span className="text-sm text-texte-secondaire">{detail}</span>
      {visuelEnBas && visuel && <div className="mt-auto pt-5">{visuel}</div>}
    </div>
  );
}
