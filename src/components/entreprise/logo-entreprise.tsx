import type { LogoAffiche } from "@/lib/donnees/entreprise";
import { cn } from "@/lib/utils";

/**
 * Logo de l'entreprise sur un fond blanc (lisible quel que soit le logo et le fond de la page),
 * proportions gardées dans la hauteur donnée. Rien sans logo.
 */
export function LogoEntreprise({ logo, className, classeImage }: { logo: LogoAffiche | null; className?: string; classeImage?: string }) {
  if (!logo) return null;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-bordure", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- route dédiée, déjà réduite à 512 px : pas d'optimisation utile. */}
      <img src={logo.src} alt={logo.alt} className={cn("h-full w-auto object-contain", classeImage)} />
    </span>
  );
}
