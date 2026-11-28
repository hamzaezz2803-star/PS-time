import { cn } from "@/lib/utils";

/** Bouton d'un filtre de la page des compteurs (état pressé annoncé aux lecteurs d'écran). */
export function BoutonFiltre({ estChoisi, onClick, children }: { estChoisi: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={estChoisi}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9",
        estChoisi ? "bg-surface text-marine shadow-carte ring-1 ring-bordure" : "text-texte-secondaire hover:text-texte",
      )}
    >
      {children}
    </button>
  );
}
