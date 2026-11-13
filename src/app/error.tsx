"use client";

import { CircleAlert } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";

/** Affichée quand une page échoue (base injoignable, par exemple). Aucun détail technique. */
export default function ErreurPage({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <CircleAlert className="size-10 text-erreur" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-marine">Une erreur est survenue</h1>
        <p className="text-base text-texte-secondaire">
          La page n&apos;a pas pu être chargée. Réessayez dans un instant. Si le problème
          continue, contactez l&apos;administrateur de votre entreprise.
        </p>
        <Bouton onClick={() => retry()}>Réessayer</Bouton>
      </div>
    </main>
  );
}
