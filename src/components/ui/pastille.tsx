import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONS = {
  info: "bg-ciel text-marine ring-primaire/15",
  neutre: "bg-fond text-texte ring-bordure",
  succes: "bg-succes/5 text-succes ring-succes/25",
  attention: "bg-attention/5 text-attention ring-attention/25",
  erreur: "bg-erreur/5 text-erreur ring-erreur/25",
} as const;

/** Petite étiquette de statut ou de type : texte toujours présent (jamais la couleur seule). */
export function Pastille({
  children,
  Icone,
  ton = "info",
}: {
  children: ReactNode;
  Icone?: LucideIcon;
  ton?: keyof typeof TONS;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-sm font-medium tabular-nums ring-1 ring-inset", TONS[ton])}>
      {Icone && <Icone className="size-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
