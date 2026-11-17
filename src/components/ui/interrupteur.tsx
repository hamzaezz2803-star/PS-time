"use client";

import { useState, useTransition } from "react";
import type { EtatFormulaire } from "@/types";
import { cn } from "@/lib/utils";
import { MessageErreur } from "./message-erreur";

/**
 * Interrupteur « actif / inactif » relié à une action serveur. Le libellé reste visible
 * (jamais la couleur seule) ; l'erreur éventuelle s'affiche dessous.
 */
export function Interrupteur({
  estActif,
  basculer,
  libelles,
}: {
  estActif: boolean;
  basculer: (nouvelEtat: boolean) => Promise<EtatFormulaire>;
  libelles: { actif: string; inactif: string; activer: string; desactiver: string };
}) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string>();

  const surClic = () =>
    demarrer(async () => {
      const resultat = await basculer(!estActif);
      setErreur(resultat.succes ? undefined : resultat.message);
    });

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={estActif}
        aria-label={estActif ? libelles.desactiver : libelles.activer}
        onClick={surClic}
        disabled={enCours}
        className="inline-flex min-h-11 items-center gap-2.5 rounded-md text-sm font-medium text-texte focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire disabled:opacity-60 lg:min-h-9"
      >
        <span className={cn("relative h-6 w-10 shrink-0 rounded-md transition-colors duration-150", estActif ? "bg-succes" : "bg-bordure-champ")}>
          <span
            className={cn(
              "absolute top-1 left-0 size-4 rounded-sm bg-white shadow-carte transition-transform duration-150 motion-reduce:transition-none",
              estActif ? "translate-x-5" : "translate-x-1",
            )}
          />
        </span>
        {estActif ? libelles.actif : libelles.inactif}
      </button>
      <MessageErreur message={erreur} />
    </div>
  );
}
