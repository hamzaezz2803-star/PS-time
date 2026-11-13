import { LoaderCircle } from "lucide-react";

/** État de chargement accessible (annoncé aux lecteurs d'écran). */
export function Chargement({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="flex items-center gap-3 text-base text-texte-secondaire"
    >
      <LoaderCircle
        className="size-5 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      {message}
    </p>
  );
}
