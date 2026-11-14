"use client";

import { useActionState } from "react";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFenetre } from "@/components/ui/pied-fenetre";
import type { EtatFormulaire } from "@/types";

type Succes = NonNullable<EtatFormulaire["succes"]>;

export type TextesSuppression = {
  confirmerSuppression: (nom: string) => string;
  explicationSuppression: string;
  oui: string;
  annuler: string;
};

/** Contenu de la fenêtre de suppression : question claire, conséquence, puis confirmation. */
export function SuppressionElement({
  id,
  nom,
  action,
  textes,
  onTermine,
  onAnnuler,
}: {
  id: string;
  nom: string;
  action: (etat: EtatFormulaire, formulaire: FormData) => Promise<EtatFormulaire>;
  textes: TextesSuppression;
  onTermine: (succes: Succes) => void;
  onAnnuler: () => void;
}) {
  // Le résultat est transmis dès la réponse : la fenêtre se ferme avant qu'un effet ait pu s'exécuter.
  const [etat, actionFormulaire, enCours] = useActionState(
    async (precedent: EtatFormulaire, formulaire: FormData) => {
      const resultat = await action(precedent, formulaire);
      if (resultat.succes) onTermine(resultat.succes);
      return resultat;
    },
    {},
  );

  return (
    <form action={actionFormulaire}>
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-4 px-5 py-6 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-erreur/10 text-erreur">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-texte">{textes.confirmerSuppression(nom)}</p>
          <p className="text-base text-texte-secondaire">{textes.explicationSuppression}</p>
          <div role="alert" aria-live="polite">
            <MessageErreur message={etat.message} />
          </div>
        </div>
      </div>
      <PiedFenetre>
        <Bouton type="submit" variante="contour" disabled={enCours} className="border-erreur text-erreur hover:bg-erreur/5">
          {enCours ? (
            <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Trash2 className="size-5" aria-hidden="true" />
          )}
          {textes.oui}
        </Bouton>
        {/* Choix sans risque mis en avant : le focus initial va sur « Annuler ». */}
        <Bouton variante="fantome" onClick={onAnnuler} data-focus-initial>
          {textes.annuler}
        </Bouton>
      </PiedFenetre>
    </form>
  );
}
