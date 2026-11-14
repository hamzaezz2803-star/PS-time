import type { ReactNode } from "react";

/**
 * Barre d'actions en bas d'une fenêtre. Mettre le bouton principal en premier dans le code :
 * il s'affiche à droite (ordre inversé) et c'est lui que déclenche la touche Entrée.
 */
export function PiedFenetre({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-bordure bg-fond px-5 py-3 sm:flex-row-reverse sm:justify-start sm:px-6">
      {children}
    </div>
  );
}
