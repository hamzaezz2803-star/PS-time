"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { SuppressionElement, type TextesSuppression } from "@/components/arbre/suppression-element";
import { Bouton } from "@/components/ui/bouton";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import type { EtatFormulaire } from "@/types";

type Succes = NonNullable<EtatFormulaire["succes"]>;
type Fenetre = { type: "creation" } | { type: "modification"; id: string } | { type: "suppression"; id: string; nom: string };
type ProprietesFormulaire = { onTermine: (succes: Succes) => void; onAnnuler: () => void };

export type TextesGestionSaisie = TextesSuppression & { nouveau: string; titreCreation: string; titreSuppression: string; fermer: string; titreModification?: string };

/** La liste (rendue par le serveur) demande ici l'ouverture d'une fenêtre pour une de ses lignes. */
const ContexteSaisie = createContext<((fenetre: Fenetre) => void) | null>(null);

/** Bouton « supprimer » d'une ligne de la liste (le libellé accessible nomme la ligne). */
export function BoutonSupprimerSaisie({ id, nom, libelle }: { id: string; nom: string; libelle: string }) {
  const ouvrir = use(ContexteSaisie);
  if (!ouvrir) return null;
  return <BoutonIcone libelle={libelle} Icone={Trash2} onClick={() => ouvrir({ type: "suppression", id, nom })} estDanger />;
}

/** Bouton « supprimer » avec son texte, par exemple au bas d'une fenêtre de modification. */
export function LienSupprimerSaisie({ id, nom, libelle }: { id: string; nom: string; libelle: string }) {
  const ouvrir = use(ContexteSaisie);
  if (!ouvrir) return null;
  return (
    <Bouton variante="fantome" onClick={() => ouvrir({ type: "suppression", id, nom })} className="w-fit text-erreur hover:bg-erreur/5">
      <Trash2 className="size-4" aria-hidden="true" />
      {libelle}
    </Bouton>
  );
}

/** Bouton « modifier » d'une ligne (seulement si la gestion sait afficher une modification). */
export function BoutonModifierSaisie({ id, libelle }: { id: string; libelle: string }) {
  const ouvrir = use(ContexteSaisie);
  if (!ouvrir) return null;
  return <BoutonIcone libelle={libelle} Icone={Pencil} onClick={() => ouvrir({ type: "modification", id })} />;
}

/**
 * Saisie autour d'une liste paginée par le serveur (pointages manuels, absences, droits aux
 * congés) : bouton « Nouveau », message de réussite, fenêtres de saisie, de modification
 * (facultative) et de suppression.
 */
export function GestionSaisie({
  textes,
  actionSupprimer,
  rendreFormulaire,
  rendreModification,
  children,
}: {
  textes: TextesGestionSaisie;
  actionSupprimer: (etat: EtatFormulaire, formulaire: FormData) => Promise<EtatFormulaire>;
  rendreFormulaire: (proprietes: ProprietesFormulaire) => ReactNode;
  rendreModification?: (id: string, proprietes: ProprietesFormulaire) => ReactNode;
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
  const titres = { creation: textes.titreCreation, modification: textes.titreModification ?? textes.titreCreation, suppression: textes.titreSuppression };

  return (
    <ContexteSaisie value={ouvrir}>
      <div className="flex flex-col gap-3">
        <Bouton onClick={() => ouvrir({ type: "creation" })} className="w-full sm:w-fit">
          <Plus className="size-5" aria-hidden="true" />
          {textes.nouveau}
        </Bouton>
        {!fenetre && <MessageSucces message={messageSucces} />}
      </div>
      {children}

      <FenetreModale ouverte={fenetre !== null} onFermer={fermer} titre={fenetre ? titres[fenetre.type] : textes.titreCreation} libelleFermer={textes.fermer}>
        {fenetre?.type === "creation" && rendreFormulaire({ onTermine: terminer, onAnnuler: fermer })}
        {fenetre?.type === "modification" && rendreModification?.(fenetre.id, { onTermine: terminer, onAnnuler: fermer })}
        {fenetre?.type === "suppression" && (
          <SuppressionElement id={fenetre.id} nom={fenetre.nom} action={actionSupprimer} textes={textes} onTermine={terminer} onAnnuler={fermer} />
        )}
      </FenetreModale>
    </ContexteSaisie>
  );
}
