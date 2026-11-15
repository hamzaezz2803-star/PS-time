import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const STYLES_VARIANTES = {
  principal: "bg-primaire text-white shadow-carte hover:bg-primaire-survol",
  contour:
    "border border-bordure-champ bg-surface text-texte shadow-carte hover:bg-fond",
  fantome: "text-primaire hover:bg-ciel",
} as const;

type BoutonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof STYLES_VARIANTES;
};

export function Bouton({
  variante = "principal",
  className,
  type = "button",
  ...props
}: BoutonProps) {
  return (
    <button
      type={type}
      className={cn(
        // 44 px de haut sur mobile (zone tactile), 40 px sur ordinateur.
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-base font-semibold transition-[color,background-color,transform] duration-150 enabled:active:translate-y-px motion-reduce:transform-none lg:min-h-10",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire",
        "disabled:cursor-not-allowed disabled:opacity-60",
        STYLES_VARIANTES[variante],
        className,
      )}
      {...props}
    />
  );
}
