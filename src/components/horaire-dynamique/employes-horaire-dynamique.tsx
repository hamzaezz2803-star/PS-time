"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { enregistrerEmployes } from "@/app/(connecte)/programme/horaire-dynamique/actions";
import { ChoixEmployes, type EmployeChoisissable } from "@/components/employes/choix-employes";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";
import type { EtatFormulaire } from "@/types";

/** Employés dont l'horaire est reconnu d'après leur premier pointage : cases à cocher, filtre par département. */
export function EmployesHoraireDynamique({
  employes,
  departements,
  selection,
}: {
  employes: EmployeChoisissable[];
  departements: ElementArbre[];
  selection: string[];
}) {
  const [etat, action, enCours] = useActionState(enregistrerEmployes, {} as EtatFormulaire);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5">
      <h2 className="text-base font-semibold text-marine">{textes.titreEmployes}</h2>
      <ChoixEmployes employes={employes} departements={departements} nomChamp="employes" selectionInitiale={selection} textes={textes} />
      <div className="flex flex-col gap-3 border-t border-bordure pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          <MessageSucces message={etat.succes?.message} />
          <MessageErreur message={etat.message} />
        </div>
        <Bouton type="submit" disabled={enCours || employes.length === 0} className="w-full sm:w-fit">
          <Save className="size-5" aria-hidden="true" />
          {enCours ? textes.enregistrementEnCours : textes.enregistrerEmployes}
        </Bouton>
      </div>
    </form>
  );
}
