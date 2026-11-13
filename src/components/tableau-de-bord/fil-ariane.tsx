"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cheminVersFilAriane } from "./navigation";

/** Où suis-je : section puis page, déduits du menu (aucun texte en double). */
export function FilAriane() {
  const etapes = cheminVersFilAriane(usePathname());
  if (etapes.length === 0) return null;

  return (
    <nav aria-label={TEXTES_NAVIGATION.filAriane} className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {etapes.map((etape, index) => {
          const estDerniere = index === etapes.length - 1;
          return (
            <li key={etape} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="size-3.5 shrink-0 text-texte-secondaire" aria-hidden="true" />
              )}
              <span
                aria-current={estDerniere ? "page" : undefined}
                className={estDerniere ? "truncate font-medium text-texte" : "hidden truncate text-texte-secondaire sm:inline"}
              >
                {etape}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
