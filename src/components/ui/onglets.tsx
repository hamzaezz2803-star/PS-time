"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DefinitionOnglet = {
  id: string;
  libelle: string;
  /** Nombre d'erreurs dans l'onglet : affiché en pastille (jamais par la couleur seule). */
  nombreErreurs?: number;
  libelleErreurs?: (nombre: number) => string;
};

const idOnglet = (base: string, id: string) => `${base}-onglet-${id}`;
const idPanneau = (base: string, id: string) => `${base}-panneau-${id}`;

/**
 * Barre d'onglets accessible (motif ARIA « tabs ») : flèches gauche/droite, Début et Fin
 * pour se déplacer ; seul l'onglet actif reçoit le focus avec Tab.
 */
export function ListeOnglets({
  base,
  onglets,
  actif,
  onChanger,
  libelle,
}: {
  base: string;
  onglets: DefinitionOnglet[];
  actif: string;
  onChanger: (id: string) => void;
  libelle: string;
}) {
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);

  const surTouche = (evenement: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const dernier = onglets.length - 1;
    const cibles: Record<string, number> = {
      ArrowRight: index === dernier ? 0 : index + 1,
      ArrowLeft: index === 0 ? dernier : index - 1,
      Home: 0,
      End: dernier,
    };
    const cible = cibles[evenement.key];
    if (cible === undefined) return;
    evenement.preventDefault();
    onChanger(onglets[cible].id);
    boutons.current[cible]?.focus();
  };

  return (
    <div role="tablist" aria-label={libelle} className="flex flex-wrap gap-1 border-b border-bordure">
      {onglets.map((onglet, index) => {
        const estActif = onglet.id === actif;
        const nombreErreurs = onglet.nombreErreurs ?? 0;
        return (
          <button
            key={onglet.id}
            ref={(element) => {
              boutons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={idOnglet(base, onglet.id)}
            aria-selected={estActif}
            aria-controls={idPanneau(base, onglet.id)}
            tabIndex={estActif ? 0 : -1}
            onClick={() => onChanger(onglet.id)}
            onKeyDown={(evenement) => surTouche(evenement, index)}
            className={cn(
              "-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primaire",
              estActif
                ? "border-primaire font-semibold text-marine"
                : "border-transparent text-texte-secondaire hover:border-bordure-champ hover:text-texte",
            )}
          >
            {onglet.libelle}
            {nombreErreurs > 0 && (
              <span className="rounded-md bg-erreur px-1.5 text-sm font-semibold text-white">
                {onglet.libelleErreurs?.(nombreErreurs) ?? nombreErreurs}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Contenu d'un onglet : masqué (`hidden`) mais présent, donc ses champs restent envoyés avec le formulaire. */
export function PanneauOnglet({
  base,
  id,
  actif,
  children,
}: {
  base: string;
  id: string;
  actif: string;
  children: ReactNode;
}) {
  return (
    <div role="tabpanel" id={idPanneau(base, id)} aria-labelledby={idOnglet(base, id)} hidden={id !== actif} className="pt-5">
      {children}
    </div>
  );
}
