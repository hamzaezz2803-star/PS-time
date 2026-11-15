"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supprimerPointage } from "@/app/(connecte)/exceptions/pointages-manuels/actions";
import { SuppressionElement } from "@/components/arbre/suppression-element";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { Bouton } from "@/components/ui/bouton";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import type { ElementArbre } from "@/lib/metier/arbre";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import type { EtatFormulaire } from "@/types";
import { FormulairePointage } from "./formulaire-pointage";

const textes = TEXTES_EXCEPTIONS.pointages;

type Succes = NonNullable<EtatFormulaire["succes"]>;
type Fenetre = { type: "creation" } | { type: "suppression"; id: string; nom: string };

/** La liste (rendue par le serveur) demande ici l'ouverture de la fenêtre de suppression. */
const ContextePointages = createContext<((id: string, nom: string) => void) | null>(null);

/** Bouton « supprimer » d'une ligne de la liste. */
export function BoutonSupprimerPointage({ id, nom }: { id: string; nom: string }) {
  const demanderSuppression = use(ContextePointages);
  if (!demanderSuppression) return null;
  return <BoutonIcone libelle={textes.supprimer(nom)} Icone={Trash2} onClick={() => demanderSuppression(id, nom)} estDanger />;
}

/** Bouton « Nouveau pointage », message de réussite et fenêtres (saisie, suppression) autour de la liste. */
export function GestionPointages({
  employes,
  departements,
  children,
}: {
  employes: EmployeChoisissable[];
  departements: ElementArbre[];
  children: ReactNode;
}) {
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [messageSucces, setMessageSucces] = useState<string>();

  const ouvrir = (nouvelle: Fenetre) => {
    setMessageSucces(undefined);
    setFenetre(nouvelle);
  };
  const fermer = () => setFenetre(null);
  const terminer = (succes: Succes) => {
    setMessageSucces(succes.message);
    fermer();
  };

  return (
    <ContextePointages value={(id, nom) => ouvrir({ type: "suppression", id, nom })}>
      <div className="flex flex-col gap-3">
        <Bouton onClick={() => ouvrir({ type: "creation" })} className="w-full sm:w-fit">
          <Plus className="size-5" aria-hidden="true" />
          {textes.nouveau}
        </Bouton>
        {!fenetre && <MessageSucces message={messageSucces} />}
      </div>
      {children}

      <FenetreModale
        ouverte={fenetre !== null}
        onFermer={fermer}
        titre={fenetre?.type === "suppression" ? textes.titreSuppression : textes.titreCreation}
        libelleFermer={textes.fermer}
      >
        {fenetre?.type === "creation" && (
          <FormulairePointage employes={employes} departements={departements} onTermine={terminer} onAnnuler={fermer} />
        )}
        {fenetre?.type === "suppression" && (
          <SuppressionElement id={fenetre.id} nom={fenetre.nom} action={supprimerPointage} textes={textes} onTermine={terminer} onAnnuler={fermer} />
        )}
      </FenetreModale>
    </ContextePointages>
  );
}
