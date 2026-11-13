"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import type { EtatFormulaire } from "@/types";

type Succes = NonNullable<EtatFormulaire["succes"]>;

export type TextesSuppression = {
  supprimer: string;
  confirmerSuppression: (nom: string) => string;
  oui: string;
  annuler: string;
};

/** Suppression en deux temps : le premier clic demande une confirmation. */
export function SuppressionElement({
  id,
  nom,
  action,
  textes,
  onTermine,
}: {
  id: string;
  nom: string;
  action: (etat: EtatFormulaire, formulaire: FormData) => Promise<EtatFormulaire>;
  textes: TextesSuppression;
  onTermine: (succes: Succes) => void;
}) {
  // Le résultat est transmis dès la réponse : après suppression, ce composant disparaît
  // (son élément n'existe plus) avant qu'un effet ait pu s'exécuter.
  const [etat, actionFormulaire, enCours] = useActionState(
    async (precedent: EtatFormulaire, formulaire: FormData) => {
      const resultat = await action(precedent, formulaire);
      if (resultat.succes) onTermine(resultat.succes);
      return resultat;
    },
    {},
  );
  const [demandeConfirmation, setDemandeConfirmation] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-t border-bordure pt-5">
      <div role="alert" aria-live="polite">
        <MessageErreur message={etat.message} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
      </div>

      {demandeConfirmation ? (
        <form action={actionFormulaire} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-base font-medium text-texte">{textes.confirmerSuppression(nom)}</p>
          <div className="flex flex-wrap gap-3">
            <Bouton type="submit" variante="contour" disabled={enCours} className="border-erreur text-erreur hover:bg-erreur/5">
              <Trash2 className="size-5" aria-hidden="true" />
              {textes.oui}
            </Bouton>
            <Bouton variante="fantome" onClick={() => setDemandeConfirmation(false)}>
              {textes.annuler}
            </Bouton>
          </div>
        </form>
      ) : (
        <Bouton variante="fantome" onClick={() => setDemandeConfirmation(true)} className="w-fit text-erreur hover:bg-erreur/5">
          <Trash2 className="size-5" aria-hidden="true" />
          {textes.supprimer}
        </Bouton>
      )}
    </div>
  );
}
