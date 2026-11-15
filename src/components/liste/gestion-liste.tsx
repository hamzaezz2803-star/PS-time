"use client";

import { useState, type ReactNode } from "react";
import { Plus, SearchX, type LucideIcon } from "lucide-react";
import { SuppressionElement, type TextesSuppression } from "@/components/arbre/suppression-element";
import { Bouton } from "@/components/ui/bouton";
import { ChampRecherche } from "@/components/ui/champ-recherche";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import { correspondARecherche } from "@/lib/metier/recherche";
import { TEXTES_LISTE } from "@/lib/textes/liste";
import type { EtatFormulaire } from "@/types";
import { TableauListe } from "./tableau-liste";

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
  const [recherche, setRecherche] = useState("");
  const visibles = elements.filter((element) => correspondARecherche(element.nom, recherche));

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
      <section className="overflow-hidden rounded-xl border border-bordure bg-surface shadow-carte" aria-labelledby="titre-liste">
        <div className="flex flex-wrap items-center gap-3 border-b border-bordure px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <h2 id="titre-liste" className="text-base font-semibold text-marine">{textes.titre}</h2>
            <span className="rounded-md bg-fond px-2 py-0.5 text-sm font-medium tabular-nums text-texte-secondaire ring-1 ring-inset ring-bordure">
              {textes.total(elements.length)}
            </span>
          </div>
          {elements.length > 0 && (
            <ChampRecherche
              id="recherche-liste"
              libelle={TEXTES_LISTE.rechercher}
              valeur={recherche}
              onChange={setRecherche}
              placeholder={TEXTES_LISTE.exempleRecherche}
              className="w-full sm:w-64"
            />
          )}
          <Bouton onClick={() => ouvrir({ type: "creation" })} className="w-full sm:w-fit">
            <Plus className="size-5" aria-hidden="true" />
            {textes.nouveau}
          </Bouton>
        </div>

        {elements.length === 0 ? (
          <EtatVide Icone={Icone} titre={textes.vide} detail={textes.videAction} />
        ) : visibles.length === 0 ? (
          <EtatVide Icone={SearchX} titre={TEXTES_LISTE.aucunResultat(recherche.trim())} />
        ) : (
          <TableauListe
            elements={visibles}
            colonnes={colonnes}
            icone={Icone}
            idEnEvidence={idEnEvidence}
            textes={textes}
            onModifier={(id) => ouvrir({ type: "modification", id })}
            onSupprimer={(id) => ouvrir({ type: "suppression", id })}
          />
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

/** État vide d'une liste (aucun élément, ou aucun résultat de recherche). */
function EtatVide({ Icone, titre, detail }: { Icone: LucideIcon; titre: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire ring-8 ring-ciel/40">
        <Icone className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-1 text-base font-semibold text-texte">{titre}</p>
      {detail && <p className="max-w-sm text-sm text-texte-secondaire">{detail}</p>}
    </div>
  );
}
