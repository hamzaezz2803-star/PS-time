import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ChampSaisie({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-lg border border-bordure-champ bg-surface px-4 text-base text-texte",
        "placeholder:text-texte-secondaire transition-colors duration-150",
        "focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primaire",
        "aria-invalid:border-erreur aria-invalid:focus-visible:outline-erreur",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
