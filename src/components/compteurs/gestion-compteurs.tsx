"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { supprimerCompteur } from "@/app/(connecte)/presence/compteurs/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { ListeOnglets, PanneauOnglet } from "@/components/ui/onglets";
import { Pastille } from "@/components/ui/pastille";
import { PERIODICITES, type Periodicite } from "@/lib/metier/compteurs/periodes";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES } from "@/lib/textes/variables-compteurs";
import type { Compteur } from "@/types";
import { BoutonFiltre } from "./bouton-filtre";
import { EtatCompteur } from "./carte-compteur-pack";
import { CataloguePack, compteursDuPack } from "./catalogue-pack";
import { FormulaireCompteur } from "./formulaire-compteur";

type FiltreEtat = "tous" | "actifs" | "inactifs";
type Onglet = "pack" | "tous";
const BASE_ONGLETS = "compteurs";

const COLONNES: ColonneListe<Compteur>[] = [
  {
    titre: textes.colonnes.compteur,
    rendu: (compteur) => (
      <span className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-2">
          {compteur.nom}
          {compteur.pack && <Pastille ton="info">{`${textes.pack.badgePack} · ${textes.pack.numero(compteur.pack.numero)}`}</Pastille>}
        </span>
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
  { titre: textes.colonnes.etat, rendu: (compteur) => <EtatCompteur compteur={compteur} /> },
];

/** Liste de tous les compteurs avec filtres (périodicité, état), création et modification en fenêtre. */
function ListeCompteurs({ compteurs }: { compteurs: Compteur[] }) {
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
        actionSupprimer={supprimerCompteur}
      />
    </div>
  );
}

/** Page des compteurs : onglet du pack standard (explications, activation) et liste de tous les compteurs. */
export function GestionCompteurs({ compteurs }: { compteurs: Compteur[] }) {
  const pack = compteursDuPack(compteurs);
  const [onglet, setOnglet] = useState<Onglet>(pack.length > 0 ? "pack" : "tous");
  const onglets = [
    { id: "pack", libelle: textes.pack.ongletPack(pack.length) },
    { id: "tous", libelle: textes.pack.ongletTous(compteurs.length) },
  ];

  return (
    <div className="flex flex-col">
      <ListeOnglets base={BASE_ONGLETS} onglets={onglets} actif={onglet} onChanger={(id) => setOnglet(id as Onglet)} libelle={textes.pack.libelleOnglets} />
      <PanneauOnglet base={BASE_ONGLETS} id="pack" actif={onglet}>
        <CataloguePack compteurs={pack} />
      </PanneauOnglet>
      <PanneauOnglet base={BASE_ONGLETS} id="tous" actif={onglet}>
        <ListeCompteurs compteurs={compteurs} />
      </PanneauOnglet>
    </div>
  );
}
