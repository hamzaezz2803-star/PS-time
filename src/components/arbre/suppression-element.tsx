"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { supprimerDepartement } from "@/app/(connecte)/personnel/departements/actions";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";
import type { EtatFormulaireDepartement } from "@/types";

const { formulaire: textes } = TEXTES_DEPARTEMENTS;
const ETAT_INITIAL: EtatFormulaireDepartement = {};

type Succes = NonNullable<EtatFormulaireDepartement["succes"]>;

/** Suppression en deux temps : le premier clic demande une confirmation. */
export function SuppressionDepartement({
  id,
  nom,
  onTermine,
}: {
  id: string;
  nom: string;
  onTermine: (succes: Succes) => void;
}) {
  // Le résultat est transmis dès la réponse : après suppression, ce composant disparaît
  // (son département n'existe plus) avant qu'un effet ait pu s'exécuter.
  const [etat, action, enCours] = useActionState(
    async (precedent: EtatFormulaireDepartement, formulaire: FormData) => {
      const resultat = await supprimerDepartement(precedent, formulaire);
      if (resultat.succes) onTermine(resultat.succes);
      return resultat;
    },
    ETAT_INITIAL,
  );
  const [demandeConfirmation, setDemandeConfirmation] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-t border-bordure pt-5">
      <div role="alert" aria-live="polite">
        <MessageErreur
          message={etat.message}
          className="rounded-lg border border-erreur/30 bg-erreur/5 p-3"
        />
      </div>

      {demandeConfirmation ? (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-base font-medium text-texte">{textes.confirmerSuppression(nom)}</p>
          <div className="flex flex-wrap gap-3">
            <Bouton
              type="submit"
              variante="contour"
              disabled={enCours}
              className="border-erreur text-erreur hover:bg-erreur/5"
            >
              <Trash2 className="size-5" aria-hidden="true" />
              {textes.oui}
            </Bouton>
            <Bouton variante="fantome" onClick={() => setDemandeConfirmation(false)}>
              {textes.annuler}
            </Bouton>
          </div>
        </form>
      ) : (
        <Bouton
          variante="fantome"
          onClick={() => setDemandeConfirmation(true)}
          className="w-fit text-erreur hover:bg-erreur/5"
        >
          <Trash2 className="size-5" aria-hidden="true" />
          {textes.supprimer}
        </Bouton>
      )}
    </div>
  );
}
