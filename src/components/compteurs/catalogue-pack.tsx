"use client";

import { useState } from "react";
import { PackageOpen } from "lucide-react";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import { FAMILLES_COMPTEUR } from "@/lib/constantes";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import type { Compteur, FichePackCompteur } from "@/types";
import { BoutonFiltre } from "./bouton-filtre";
import { FormulaireCompteur } from "./formulaire-compteur";
import { LigneCompteurPack } from "./ligne-compteur-pack";

type Famille = FichePackCompteur["famille"];
type CompteurPack = Compteur & { pack: FichePackCompteur };

/** Compteurs du pack standard, dans l'ordre du pack. */
export const compteursDuPack = (compteurs: Compteur[]): CompteurPack[] =>
  compteurs.filter((compteur): compteur is CompteurPack => compteur.pack !== null).sort((a, b) => a.pack.numero - b.pack.numero);

/** Chiffre du résumé sur une ligne (nombre réel, calculé sur les compteurs de la base). */
function Chiffre({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <span className="text-sm text-texte-secondaire">
      <span className="font-semibold tabular-nums text-marine">{valeur}</span> {libelle}
    </span>
  );
}

/**
 * Pack standard : résumé sur une ligne, filtre par famille, une ligne compacte par compteur
 * (détail dépliable), activation directe et modification dans une fenêtre.
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-texte-secondaire">{textes.pack.intro}</p>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-canevas p-1" role="group" aria-label={textes.pack.filtreFamille}>
          <BoutonFiltre estChoisi={famille === null} onClick={() => setFamille(null)}>{textes.pack.toutesFamilles}</BoutonFiltre>
          {familles.map((valeur) => (
            <BoutonFiltre key={valeur} estChoisi={famille === valeur} onClick={() => setFamille(valeur)}>{textes.pack.famillesCourtes[valeur]}</BoutonFiltre>
          ))}
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Chiffre libelle={textes.pack.resume.actifs} valeur={nombreActifs} />
          <Chiffre libelle={textes.pack.resume.prets} valeur={compteurs.length - nombreActifs - nombreAAdapter} />
          <Chiffre libelle={textes.pack.resume.aAdapter} valeur={nombreAAdapter} />
        </p>
      </div>

      {!idModifie && <MessageSucces message={messageSucces} />}

      <div className="overflow-hidden rounded-xl border border-bordure bg-surface shadow-carte">
        {famillesAffichees.map((valeur) => {
          const membres = compteurs.filter((compteur) => compteur.pack.famille === valeur);
          return (
            <section key={valeur} aria-labelledby={`famille-${valeur}`} className="border-b border-bordure last:border-b-0">
              <h2 id={`famille-${valeur}`} className="flex items-center gap-2 border-b border-bordure bg-fond px-4 py-2 text-sm font-semibold text-marine">
                {textes.pack.familles[valeur]}
                <span className="font-normal tabular-nums text-texte-secondaire">({membres.length})</span>
              </h2>
              <ul className="divide-y divide-bordure">
                {membres.map((compteur) => (
                  <LigneCompteurPack
                    key={compteur.id}
                    compteur={compteur}
                    pack={compteur.pack}
                    onModifier={() => {
                      setMessageSucces(undefined);
                      setIdModifie(compteur.id);
                    }}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

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
