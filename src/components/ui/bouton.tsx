import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const STYLES_VARIANTES = {
  principal: "bg-primaire text-white hover:bg-primaire-survol",
  contour:
    "border border-bordure-champ bg-surface text-texte hover:bg-ciel",
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
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire",
        "disabled:cursor-not-allowed disabled:opacity-60",
        STYLES_VARIANTES[variante],
        className,
      )}
      {...props}
    />
  );
}
