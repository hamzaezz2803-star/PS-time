"use client";

import { useState } from "react";
import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";
import { TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";

/** Extensions proposées par le sélecteur de fichiers ; le serveur revérifie le vrai format. */
export const ACCEPT_PIECES_JOINTES = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp";

/** Champ de fichiers (PDF ou images), commun à la case à cocher et à la fenêtre des pièces jointes. */
export function ChampFichiers({ erreur, requis = false }: { erreur?: string; requis?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Etiquette htmlFor="fichiers">{textes.fichiers}</Etiquette>
      <input
        id="fichiers"
        name="fichiers"
        type="file"
        multiple
        required={requis}
        accept={ACCEPT_PIECES_JOINTES}
        aria-invalid={erreur ? true : undefined}
        className="block w-full rounded-lg border border-bordure-champ bg-surface text-base text-texte file:me-3 file:min-h-11 file:cursor-pointer file:border-0 file:border-e file:border-bordure file:bg-ciel file:px-4 file:font-medium file:text-marine hover:file:bg-canevas focus-visible:outline-2 focus-visible:outline-primaire"
      />
      <MessageErreur message={erreur} />
    </div>
  );
}

/** Case « pièce justificative » : cochée, elle affiche le champ de fichiers. */
export function ChampPiecesJointes({ cocheeInitialement, erreur }: { cocheeInitialement: boolean; erreur?: string }) {
  const [estCochee, setEstCochee] = useState(cocheeInitialement || Boolean(erreur));
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="aPieceJointe" className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-texte">
        <input
          type="checkbox"
          id="aPieceJointe"
          name="aPieceJointe"
          value="oui"
          checked={estCochee}
          onChange={(evenement) => setEstCochee(evenement.target.checked)}
          className="size-5 shrink-0 cursor-pointer rounded accent-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
        />
        {textes.aPieceJointe}
      </label>
      {estCochee && <ChampFichiers erreur={erreur} requis />}
    </div>
  );
}
