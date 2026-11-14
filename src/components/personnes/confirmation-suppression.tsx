"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { supprimerEmploye } from "@/app/(connecte)/personnel/personnes/actions";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFenetre } from "@/components/ui/pied-fenetre";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { EmployeVise } from "./contexte-employes";

const { suppression: textes } = TEXTES_PERSONNES;

/** Contenu de la fenêtre de suppression : question claire, conséquence, puis confirmation. */
export function ConfirmationSuppression({
  employe,
  onSupprime,
  onAnnuler,
}: {
  employe: EmployeVise;
  onSupprime: (message: string) => void;
  onAnnuler: () => void;
}) {
  const [erreur, setErreur] = useState<string>();
  const [enCours, demarrer] = useTransition();

  const confirmer = () =>
    demarrer(async () => {
      const resultat = await supprimerEmploye(employe.id);
      if (resultat.ok) onSupprime(resultat.donnees.message);
      else setErreur(resultat.erreur);
    });

  return (
    <>
      <div className="flex gap-4 px-5 py-6 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-erreur/10 text-erreur">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-texte">{textes.question(employe.nomComplet)}</p>
          <p className="text-base text-texte-secondaire">{textes.explication}</p>
          <div role="alert" aria-live="polite">
            <MessageErreur message={erreur} />
          </div>
        </div>
      </div>
      <PiedFenetre>
        <Bouton variante="contour" onClick={confirmer} disabled={enCours} className="border-erreur text-erreur hover:bg-erreur/5">
          {enCours ? (
            <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Trash2 className="size-5" aria-hidden="true" />
          )}
          {enCours ? textes.enCours : textes.confirmer}
        </Bouton>
        {/* Choix sans risque mis en avant : le focus initial va sur « Annuler ». */}
        <Bouton variante="fantome" onClick={onAnnuler} data-focus-initial>
          {textes.annuler}
        </Bouton>
      </PiedFenetre>
    </>
  );
}
