"use client";

import { useState } from "react";
import { Info, PackageOpen } from "lucide-react";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import { FAMILLES_COMPTEUR } from "@/lib/constantes";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import type { Compteur, FichePackCompteur } from "@/types";
import { BoutonFiltre } from "./bouton-filtre";
import { CarteCompteurPack } from "./carte-compteur-pack";
import { FormulaireCompteur } from "./formulaire-compteur";

type Famille = FichePackCompteur["famille"];
type CompteurPack = Compteur & { pack: FichePackCompteur };

/** Compteurs du pack standard, dans l'ordre du pack. */
export const compteursDuPack = (compteurs: Compteur[]): CompteurPack[] =>
  compteurs.filter((compteur): compteur is CompteurPack => compteur.pack !== null).sort((a, b) => a.pack.numero - b.pack.numero);

/** Chiffre du résumé (nombre réel, calculé sur les compteurs de la base). */
function Chiffre({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-bordure bg-surface px-4 py-3 shadow-carte">
      <span className="text-sm text-texte-secondaire">{libelle}</span>
      <span className="text-2xl font-semibold tabular-nums text-marine">{valeur}</span>
    </div>
  );
}

/**
 * Pack standard : résumé, filtre par famille, cartes groupées par famille avec leur explication,
 * activation directe et modification dans une fenêtre.
 */
export function CataloguePack({ compteurs }: { compteurs: CompteurPack[] }) {
  const [famille, setFamille] = useState<Famille | null>(null);
  const [idModifie, setIdModifie] = useState<string | null>(null);
  const [messageSucces, setMessageSucces] = useState<string>();
  const cible = compteurs.find((compteur) => compteur.id === idModifie);

  if (compteurs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-bordure bg-surface px-6 py-14 text-center shadow-carte">
        <PackageOpen className="size-8 text-primaire" aria-hidden="true" />
        <p className="max-w-md text-base text-texte">{textes.pack.aucunPack}</p>
      </div>
    );
  }

  const nombreActifs = compteurs.filter((compteur) => compteur.estActif).length;
  const nombreAAdapter = compteurs.filter((compteur) => compteur.estAAdapter).length;
  const familles = FAMILLES_COMPTEUR.filter((valeur) => compteurs.some((compteur) => compteur.pack.famille === valeur));
  const famillesAffichees = famille ? [famille] : familles;

  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-start gap-2.5 rounded-xl bg-ciel px-4 py-3 text-base text-marine">
        <Info className="mt-1 size-4 shrink-0" aria-hidden="true" />
        {textes.pack.intro}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Chiffre libelle={textes.pack.resume.total} valeur={compteurs.length} />
        <Chiffre libelle={textes.pack.resume.actifs} valeur={nombreActifs} />
        <Chiffre libelle={textes.pack.resume.prets} valeur={compteurs.length - nombreActifs - nombreAAdapter} />
        <Chiffre libelle={textes.pack.resume.aAdapter} valeur={nombreAAdapter} />
      </div>

      <div className="flex flex-wrap items-center gap-1 self-start rounded-lg bg-canevas p-1" role="group" aria-label={textes.pack.filtreFamille}>
        <BoutonFiltre estChoisi={famille === null} onClick={() => setFamille(null)}>{textes.pack.toutesFamilles}</BoutonFiltre>
        {familles.map((valeur) => (
          <BoutonFiltre key={valeur} estChoisi={famille === valeur} onClick={() => setFamille(valeur)}>{textes.pack.familles[valeur]}</BoutonFiltre>
        ))}
      </div>

      {!idModifie && <MessageSucces message={messageSucces} />}

      {famillesAffichees.map((valeur) => {
        const membres = compteurs.filter((compteur) => compteur.pack.famille === valeur);
        return (
          <section key={valeur} aria-labelledby={`famille-${valeur}`} className="flex flex-col gap-3">
            <h2 id={`famille-${valeur}`} className="flex items-center gap-2.5 text-lg font-semibold text-marine">
              {textes.pack.familles[valeur]}
              <span className="rounded-md bg-fond px-2 py-0.5 text-sm font-medium tabular-nums text-texte-secondaire ring-1 ring-inset ring-bordure">
                {textes.total(membres.length)}
              </span>
            </h2>
            {membres.length === 0 ? (
              <p className="text-sm text-texte-secondaire">{textes.pack.aucuneFamille}</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {membres.map((compteur) => (
                  <CarteCompteurPack
                    key={compteur.id}
                    compteur={compteur}
                    pack={compteur.pack}
                    onModifier={() => {
                      setMessageSucces(undefined);
                      setIdModifie(compteur.id);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <FenetreModale ouverte={cible !== undefined} onFermer={() => setIdModifie(null)} titre={cible ? textes.titreModification(cible.nom) : ""} libelleFermer={textes.fermer}>
        {cible && (
          <FormulaireCompteur
            element={cible}
            onTermine={(succes) => {
              setMessageSucces(succes.message);
              setIdModifie(null);
            }}
            onAnnuler={() => setIdModifie(null)}
          />
        )}
      </FenetreModale>
    </div>
  );
}
