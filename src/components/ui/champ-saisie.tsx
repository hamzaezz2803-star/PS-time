import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ChampSaisie({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3.5 text-base text-texte shadow-[0_1px_2px_rgb(15_27_51/0.04)] lg:h-10",
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
