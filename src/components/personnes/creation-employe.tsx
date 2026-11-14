"use client";

import Link from "next/link";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import { CHEMIN_DEPARTEMENTS } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { ChampPersonnalise } from "@/types";
import { FormulaireEmploye } from "./formulaire-employe";

const { formulaire: textes } = TEXTES_PERSONNES;

/** Bouton « Nouvel employé » qui ouvre le formulaire dans une fenêtre, comme dans CVAccess. */
export function CreationEmploye({
  departements,
  postes,
  champs,
}: {
  departements: OptionSelection[];
  postes: OptionSelection[];
  champs: ChampPersonnalise[];
}) {
  const [estOuverte, setEstOuverte] = useState(false);
  // Change à chaque création « et ajouter un autre » : le formulaire repart vide.
  const [numeroSaisie, setNumeroSaisie] = useState(0);
  const [messageSucces, setMessageSucces] = useState<string>();

  if (departements.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-bordure bg-surface p-5 text-base text-texte sm:p-6">
        <p>{textes.aucunDepartement}</p>
        <Link href={CHEMIN_DEPARTEMENTS} className="w-fit font-semibold text-primaire underline underline-offset-4">
          {textes.lienDepartements}
        </Link>
      </div>
    );
  }

  const ouvrir = () => {
    setMessageSucces(undefined);
    setNumeroSaisie((numero) => numero + 1);
    setEstOuverte(true);
  };

  const surCreation = (message: string, continuer: boolean) => {
    setMessageSucces(message);
    if (continuer) setNumeroSaisie((numero) => numero + 1);
    else setEstOuverte(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <Bouton onClick={ouvrir} className="w-full sm:w-fit">
        <UserPlus className="size-5" aria-hidden="true" />
        {textes.ouvrir}
      </Bouton>
      {!estOuverte && <MessageSucces message={messageSucces} />}

      <FenetreModale ouverte={estOuverte} onFermer={() => setEstOuverte(false)} titre={textes.titre} libelleFermer={textes.fermer}>
        {estOuverte && messageSucces && (
          <MessageSucces message={messageSucces} className="mx-5 mt-4 sm:mx-6" />
        )}
        <FormulaireEmploye
          key={numeroSaisie}
          departements={departements}
          postes={postes}
          champs={champs}
          onCree={surCreation}
          onAnnuler={() => setEstOuverte(false)}
        />
      </FenetreModale>
    </div>
  );
}
