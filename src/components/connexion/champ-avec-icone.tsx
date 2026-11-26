import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Place une icône décorative au début d'un champ (le champ doit prévoir `ps-11`). */
export function ChampAvecIcone({
  icone: Icone,
  children,
}: {
  icone: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute inset-y-0 start-0 flex w-11 items-center justify-center text-texte-secondaire">
        <Icone className="size-5" aria-hidden="true" />
      </span>
    </div>
  );
}
