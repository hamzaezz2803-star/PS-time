"use client";

import { useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { SuppressionElement, type TextesSuppression } from "@/components/arbre/suppression-element";
import { Bouton } from "@/components/ui/bouton";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import { cn } from "@/lib/utils";
import type { EtatFormulaire } from "@/types";

type Succes = NonNullable<EtatFormulaire["succes"]>;

export type ColonneListe<T> = {
  titre: string;
  rendu: (element: T) => ReactNode;
  /** Colonne secondaire masquée sur petit écran. */
  estSecondaire?: boolean;
};

export type TextesGestionListe = TextesSuppression & {
  titre: string;
  total: (nombre: number) => string;
  nouveau: string;
  vide: string;
  videAction: string;
  titreCreation: string;
  titreModification: (nom: string) => string;
  titreSuppression: string;
  modifier: (nom: string) => string;
  supprimer: (nom: string) => string;
  actions: string;
  fermer: string;
};

export type ProprietesFormulaireListe<T> = {
  element?: T;
  onTermine: (succes: Succes) => void;
  onAnnuler: () => void;
};

type Fenetre = { type: "creation" } | { type: "modification" | "suppression"; id: string };

/**
 * Liste simple (calendriers, groupes, rotations, affectations) : tableau, bouton « Nouveau »,
 * création, modification et suppression dans une fenêtre.
 */
export function GestionListe<T extends { id: string; nom: string }>({
  elements,
  colonnes,
  textes,
  icone: Icone,
  rendreFormulaire,
  actionSupprimer,
}: {
  elements: T[];
  colonnes: ColonneListe<T>[];
  textes: TextesGestionListe;
  icone: LucideIcon;
  rendreFormulaire: (proprietes: ProprietesFormulaireListe<T>) => ReactNode;
  actionSupprimer: (etat: EtatFormulaire, formulaire: FormData) => Promise<EtatFormulaire>;
}) {
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [messageSucces, setMessageSucces] = useState<string>();
  const [idEnEvidence, setIdEnEvidence] = useState<string | null>(null);

  const ouvrir = (nouvelle: Fenetre) => {
    setMessageSucces(undefined);
    setFenetre(nouvelle);
  };
  const fermer = () => setFenetre(null);
  const terminer = (succes: Succes) => {
    setMessageSucces(succes.message);
    setIdEnEvidence(succes.idSelectionne);
    fermer();
  };

  const cible = fenetre && fenetre.type !== "creation" ? elements.find((element) => element.id === fenetre.id) : undefined;
  const titreFenetre =
    fenetre?.type === "creation"
      ? textes.titreCreation
      : fenetre?.type === "suppression"
        ? textes.titreSuppression
        : cible
          ? textes.titreModification(cible.nom)
          : "";

  return (
    <div className="flex flex-col gap-4">
      {!fenetre && <MessageSucces message={messageSucces} />}
      <section className="overflow-hidden rounded-xl border border-bordure bg-surface" aria-labelledby="titre-liste">
        <div className="flex flex-wrap items-center gap-3 border-b border-bordure px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 id="titre-liste" className="text-base font-semibold text-marine">{textes.titre}</h2>
            <p className="text-sm text-texte-secondaire">{textes.total(elements.length)}</p>
          </div>
          <Bouton onClick={() => ouvrir({ type: "creation" })} className="w-full sm:w-fit">
            <Plus className="size-5" aria-hidden="true" />
            {textes.nouveau}
          </Bouton>
        </div>

        {elements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire">
              <Icone className="size-6" aria-hidden="true" />
            </span>
            <p className="text-base font-semibold text-texte">{textes.vide}</p>
            <p className="text-sm text-texte-secondaire">{textes.videAction}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-fond text-texte-secondaire">
                <tr>
                  {colonnes.map((colonne) => (
                    <th key={colonne.titre} scope="col" className={cn("px-5 py-3 font-medium", colonne.estSecondaire && "hidden md:table-cell")}>
                      {colonne.titre}
                    </th>
                  ))}
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">{textes.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure text-texte">
                {elements.map((element) => (
                  <tr key={element.id} className={cn(element.id === idEnEvidence && "bg-ciel/50")}>
                    {colonnes.map((colonne, index) => (
                      <td key={colonne.titre} className={cn("px-5 py-3", colonne.estSecondaire && "hidden md:table-cell")}>
                        {index === 0 ? (
                          <button
                            type="button"
                            onClick={() => ouvrir({ type: "modification", id: element.id })}
                            className="flex min-h-11 items-center gap-2.5 text-start text-base font-medium text-texte hover:text-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9"
                          >
                            <Icone className="size-4 shrink-0 text-texte-secondaire" aria-hidden="true" />
                            {colonne.rendu(element)}
                          </button>
                        ) : (
                          colonne.rendu(element)
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <BoutonIcone libelle={textes.modifier(element.nom)} Icone={Pencil} onClick={() => ouvrir({ type: "modification", id: element.id })} />
                        <BoutonIcone libelle={textes.supprimer(element.nom)} Icone={Trash2} onClick={() => ouvrir({ type: "suppression", id: element.id })} estDanger />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <FenetreModale ouverte={fenetre !== null} onFermer={fermer} titre={titreFenetre} libelleFermer={textes.fermer}>
        {fenetre?.type === "creation" && rendreFormulaire({ onTermine: terminer, onAnnuler: fermer })}
        {fenetre?.type === "modification" && cible && rendreFormulaire({ element: cible, onTermine: terminer, onAnnuler: fermer })}
        {fenetre?.type === "suppression" && cible && (
          <SuppressionElement id={cible.id} nom={cible.nom} action={actionSupprimer} textes={textes} onTermine={terminer} onAnnuler={fermer} />
        )}
      </FenetreModale>
    </div>
  );
}
