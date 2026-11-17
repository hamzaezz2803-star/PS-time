"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { changerEtatCompteur } from "@/app/(connecte)/presence/compteurs/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Interrupteur } from "@/components/ui/interrupteur";
import { Pastille } from "@/components/ui/pastille";
import { PERIODICITES, type Periodicite } from "@/lib/metier/compteurs/periodes";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES } from "@/lib/textes/variables-compteurs";
import { cn } from "@/lib/utils";
import type { Compteur } from "@/types";
import { FormulaireCompteur } from "./formulaire-compteur";

type FiltreEtat = "tous" | "actifs" | "inactifs";

const COLONNES: ColonneListe<Compteur>[] = [
  {
    titre: textes.colonnes.compteur,
    rendu: (compteur) => (
      <span className="flex min-w-0 flex-col">
        <span>{compteur.nom}</span>
        <span className="truncate font-mono text-sm font-normal text-texte-secondaire">{compteur.code}</span>
      </span>
    ),
  },
  {
    titre: textes.colonnes.periodicites,
    rendu: (compteur) => (
      <span className="flex flex-wrap gap-1">
        {compteur.periodicites.map((periodicite) => (
          <Pastille key={periodicite} ton="neutre">{TEXTES_PERIODICITES[periodicite]}</Pastille>
        ))}
      </span>
    ),
  },
  { titre: textes.colonnes.unite, estSecondaire: true, rendu: (compteur) => textes.unitesCourtes[compteur.unite] },
  {
    titre: textes.colonnes.etat,
    rendu: (compteur) => (
      <Interrupteur
        estActif={compteur.estActif}
        basculer={(nouvelEtat) => changerEtatCompteur(compteur.id, nouvelEtat)}
        libelles={{ actif: textes.actif, inactif: textes.inactif, activer: textes.activer(compteur.nom), desactiver: textes.desactiver(compteur.nom) }}
      />
    ),
  },
];

/** Bouton d'un filtre (état pressé annoncé aux lecteurs d'écran). */
function BoutonFiltre({ estChoisi, onClick, children }: { estChoisi: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={estChoisi}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9",
        estChoisi ? "bg-surface text-marine shadow-carte ring-1 ring-bordure" : "text-texte-secondaire hover:text-texte",
      )}
    >
      {children}
    </button>
  );
}

/** Liste des compteurs avec filtres (périodicité, état), création et modification en fenêtre. */
export function GestionCompteurs({ compteurs }: { compteurs: Compteur[] }) {
  const [periodicite, setPeriodicite] = useState<Periodicite | null>(null);
  const [filtreEtat, setFiltreEtat] = useState<FiltreEtat>("tous");
  const visibles = compteurs.filter(
    (compteur) =>
      (!periodicite || compteur.periodicites.includes(periodicite)) &&
      (filtreEtat === "tous" || compteur.estActif === (filtreEtat === "actifs")),
  );

  return (
    <div className="flex flex-col gap-4">
      {compteurs.length > 0 && (
        <div role="group" aria-label={textes.filtres.libelle} className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-canevas p-1" role="group" aria-label={textes.filtres.periodicite}>
            <BoutonFiltre estChoisi={periodicite === null} onClick={() => setPeriodicite(null)}>{textes.filtres.toutes}</BoutonFiltre>
            {PERIODICITES.map((valeur) => (
              <BoutonFiltre key={valeur} estChoisi={periodicite === valeur} onClick={() => setPeriodicite(valeur)}>{TEXTES_PERIODICITES[valeur]}</BoutonFiltre>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-canevas p-1" role="group" aria-label={textes.filtres.etat}>
            {(["tous", "actifs", "inactifs"] as const).map((valeur) => (
              <BoutonFiltre key={valeur} estChoisi={filtreEtat === valeur} onClick={() => setFiltreEtat(valeur)}>{textes.filtres[valeur]}</BoutonFiltre>
            ))}
          </div>
        </div>
      )}
      <GestionListe
        elements={visibles}
        colonnes={COLONNES}
        textes={{ ...textes, vide: compteurs.length === 0 ? textes.vide : textes.aucunFiltre, videAction: compteurs.length === 0 ? textes.videAction : "" }}
        icone={Gauge}
        rendreFormulaire={(proprietes) => <FormulaireCompteur {...proprietes} />}
      />
    </div>
  );
}
