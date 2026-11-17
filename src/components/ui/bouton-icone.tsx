"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bouton réduit à une icône : le libellé sert de nom accessible et d'info-bulle. */
export function BoutonIcone({
  libelle,
  Icone,
  onClick,
  estDanger = false,
  disabled = false,
}: {
  libelle: string;
  Icone: LucideIcon;
  onClick: () => void;
  estDanger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={libelle}
      title={libelle}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-md text-texte-secondaire transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire disabled:cursor-not-allowed disabled:opacity-50 lg:size-9",
        estDanger ? "hover:bg-erreur/5 hover:text-erreur" : "hover:bg-ciel hover:text-primaire",
      )}
    >
      <Icone className="size-[18px]" aria-hidden="true" />
    </button>
  );
}
