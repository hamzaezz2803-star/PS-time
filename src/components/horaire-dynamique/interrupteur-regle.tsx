"use client";

import { useState, useTransition } from "react";
import { changerEtatRegle } from "@/app/(connecte)/programme/horaire-dynamique/actions";
import { MessageErreur } from "@/components/ui/message-erreur";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";
import { cn } from "@/lib/utils";

/** Interrupteur « active / inactive » d'une règle ; le libellé reste visible (jamais la couleur seule). */
export function InterrupteurRegle({ id, estActif }: { id: string; estActif: boolean }) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string>();

  const basculer = () =>
    demarrer(async () => {
      const resultat = await changerEtatRegle(id, !estActif);
      setErreur(resultat.succes ? undefined : resultat.message);
    });

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={estActif}
        aria-label={estActif ? textes.desactiver : textes.activer}
        onClick={basculer}
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
        {estActif ? textes.actif : textes.inactif}
      </button>
      <MessageErreur message={erreur} />
    </div>
  );
}
