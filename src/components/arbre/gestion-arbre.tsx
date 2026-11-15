"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Pencil, SearchX, Trash2 } from "lucide-react";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { ChampRecherche } from "@/components/ui/champ-recherche";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import { filtrerArbre, idsAvecEnfants, totalAvecDescendants, type Comparateur, type ElementArbre } from "@/lib/metier/arbre";
import { correspondARecherche } from "@/lib/metier/recherche";
import { TEXTES_LISTE } from "@/lib/textes/liste";
import type { EtatFormulaire } from "@/types";
import { ArbreHierarchique, type IconesArbre, type TextesArbre } from "./arbre-hierarchique";
import type { OptionParent } from "./champ-parent";
import { PanneauArbre } from "./panneau-arbre";
import { SuppressionElement, type TextesSuppression } from "./suppression-element";
import { useGestionArbre } from "./use-gestion-arbre";

type Succes = NonNullable<EtatFormulaire["succes"]>;

export type TextesGestionArbre = TextesArbre &
  TextesSuppression & {
    titre: string;
    total: (nombre: number) => string;
    nouveau: string;
    toutDeplier: string;
    toutReplier: string;
    titreCreation: string;
    titreModification: (nom: string) => string;
    titreSuppression: string;
    modifier: (nom: string) => string;
    supprimer: (nom: string) => string;
    fermer: string;
  };

/** Ce que reçoit le formulaire propre à chaque écran (département, poste...). */
export type ProprietesFormulaireArbre<T> = {
  element?: T;
  optionsParent: OptionParent[];
  onTermine: (succes: Succes) => void;
  onAnnuler: () => void;
};

type Fenetre = { type: "creation" } | { type: "modification" | "suppression"; id: string };

/**
 * Écran en arbre (départements, postes) : liste sur toute la largeur avec « Nouveau » en haut,
 * puis création, modification et suppression dans une fenêtre.
 */
export function GestionArbre<T extends ElementArbre>({
  elements,
  comparer,
  textes,
  icones,
  nombresEmployes,
  cumulerSousElements = false,
  detail,
  texteRecherche = (element) => element.nom,
  rendreFormulaire,
  actionSupprimer,
}: {
  elements: T[];
  comparer?: Comparateur<T>;
  textes: TextesGestionArbre;
  icones: IconesArbre;
  /** Nombre d'employés par identifiant d'élément (absent = 0). */
  nombresEmployes: Record<string, number>;
  /** Vrai : un parent affiche aussi les employés de ses descendants (départements). */
  cumulerSousElements?: boolean;
  detail?: (element: T) => ReactNode;
  /** Texte dans lequel cherche le champ de recherche (par défaut le nom). */
  texteRecherche?: (element: T) => string;
  rendreFormulaire: (proprietes: ProprietesFormulaireArbre<T>) => ReactNode;
  actionSupprimer: (etat: EtatFormulaire, formulaire: FormData) => Promise<EtatFormulaire>;
}) {
  const gestion = useGestionArbre(elements, comparer);
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [recherche, setRecherche] = useState("");
  const estEnRecherche = recherche.trim() !== "";
  // En recherche : seulement les éléments trouvés et leurs parents, tout déplié.
  const arbreAffiche = useMemo(
    () => (estEnRecherche ? filtrerArbre(gestion.arbre, (element) => correspondARecherche(texteRecherche(element), recherche)) : gestion.arbre),
    [estEnRecherche, gestion.arbre, recherche, texteRecherche],
  );

  const ouvrir = (nouvelle: Fenetre) => {
    // La sélection détermine les parents proposés (jamais l'élément ni ses descendants).
    gestion.selectionner(nouvelle.type === "creation" ? null : nouvelle.id);
    setFenetre(nouvelle);
  };
  const fermer = () => setFenetre(null);
  const terminer = (succes: Succes) => {
    gestion.terminer(succes);
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
      {!fenetre && <MessageSucces message={gestion.messageSucces} />}
      <PanneauArbre
        titre={textes.titre}
        total={textes.total(elements.length)}
        textes={textes}
        onToutDeplier={gestion.toutDeplier}
        onToutReplier={gestion.toutReplier}
        onNouveau={() => ouvrir({ type: "creation" })}
        recherche={
          elements.length > 0 && (
            <ChampRecherche id="recherche-arbre" libelle={TEXTES_LISTE.rechercher} valeur={recherche} onChange={setRecherche} placeholder={TEXTES_LISTE.exempleRecherche} className="sm:max-w-sm" />
          )
        }
      >
        {estEnRecherche && arbreAffiche.length === 0 ? (
          <p className="flex flex-col items-center gap-3 px-6 py-12 text-center text-base font-semibold text-texte">
            <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire">
              <SearchX className="size-6" aria-hidden="true" />
            </span>
            {TEXTES_LISTE.aucunResultat(recherche.trim())}
          </p>
        ) : (
        <ArbreHierarchique
          noeuds={arbreAffiche}
          idSelectionne={gestion.idSelectionne}
          idsOuverts={estEnRecherche ? idsAvecEnfants(arbreAffiche) : gestion.idsOuverts}
          onBasculer={gestion.basculer}
          onSelectionner={(id) => ouvrir({ type: "modification", id })}
          textes={textes}
          icones={icones}
          nombreEmployes={(element) =>
            cumulerSousElements
              ? totalAvecDescendants(elements, element.id, nombresEmployes)
              : (nombresEmployes[element.id] ?? 0)
          }
          detail={detail}
          actions={(element) => (
            <div className="flex shrink-0 items-center">
              <BoutonIcone libelle={textes.modifier(element.nom)} Icone={Pencil} onClick={() => ouvrir({ type: "modification", id: element.id })} />
              <BoutonIcone libelle={textes.supprimer(element.nom)} Icone={Trash2} onClick={() => ouvrir({ type: "suppression", id: element.id })} estDanger />
            </div>
          )}
        />
        )}
      </PanneauArbre>

      <FenetreModale ouverte={fenetre !== null} onFermer={fermer} titre={titreFenetre} libelleFermer={textes.fermer}>
        {fenetre?.type === "creation" &&
          rendreFormulaire({ optionsParent: gestion.optionsParent, onTermine: terminer, onAnnuler: fermer })}
        {fenetre?.type === "modification" && cible &&
          rendreFormulaire({ element: cible, optionsParent: gestion.optionsParent, onTermine: terminer, onAnnuler: fermer })}
        {fenetre?.type === "suppression" && cible && (
          <SuppressionElement id={cible.id} nom={cible.nom} action={actionSupprimer} textes={textes} onTermine={terminer} onAnnuler={fermer} />
        )}
      </FenetreModale>
    </div>
  );
}
