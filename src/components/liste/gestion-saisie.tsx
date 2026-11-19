"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SuppressionElement, type TextesSuppression } from "@/components/arbre/suppression-element";
import { Bouton } from "@/components/ui/bouton";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import type { EtatFormulaire } from "@/types";

type Succes = NonNullable<EtatFormulaire["succes"]>;
type Fenetre = { type: "creation" } | { type: "suppression"; id: string; nom: string };

export type TextesGestionSaisie = TextesSuppression & { nouveau: string; titreCreation: string; titreSuppression: string; fermer: string };

/** La liste (rendue par le serveur) demande ici l'ouverture de la fenêtre de suppression. */
const ContexteSaisie = createContext<((id: string, nom: string) => void) | null>(null);

/** Bouton « supprimer » d'une ligne de la liste (le libellé accessible nomme la ligne). */
export function BoutonSupprimerSaisie({ id, nom, libelle }: { id: string; nom: string; libelle: string }) {
  const demanderSuppression = use(ContexteSaisie);
  if (!demanderSuppression) return null;
  return <BoutonIcone libelle={libelle} Icone={Trash2} onClick={() => demanderSuppression(id, nom)} estDanger />;
}

/**
 * Saisie autour d'une liste paginée par le serveur (pointages manuels, absences) : bouton
 * « Nouveau », message de réussite, fenêtre de saisie et fenêtre de suppression.
 */
export function GestionSaisie({
  textes,
  actionSupprimer,
  rendreFormulaire,
  children,
}: {
  textes: TextesGestionSaisie;
  actionSupprimer: (etat: EtatFormulaire, formulaire: FormData) => Promise<EtatFormulaire>;
  rendreFormulaire: (proprietes: { onTermine: (succes: Succes) => void; onAnnuler: () => void }) => ReactNode;
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
    <ContexteSaisie value={(id, nom) => ouvrir({ type: "suppression", id, nom })}>
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
        {fenetre?.type === "creation" && rendreFormulaire({ onTermine: terminer, onAnnuler: fermer })}
        {fenetre?.type === "suppression" && (
          <SuppressionElement id={fenetre.id} nom={fenetre.nom} action={actionSupprimer} textes={textes} onTermine={terminer} onAnnuler={fermer} />
        )}
      </FenetreModale>
    </ContexteSaisie>
  );
}
