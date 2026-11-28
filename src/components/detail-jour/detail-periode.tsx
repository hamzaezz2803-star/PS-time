"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { formaterJour } from "@/lib/formats";
import { formaterValeur } from "@/lib/metier/compteurs/format";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import type { Compteur, JourDetail, ValeurAffichee } from "@/types";
import { DureeJour, EvenementJour, HoraireJour, PresenceJour } from "./elements-jour";

const textes = TEXTES_DETAIL_JOUR.compteurs;
const colonnes = TEXTES_DETAIL_JOUR.jour;

/**
 * Compteur de la semaine ou du mois cliquable : toute la carte ouvre une fenêtre qui montre les
 * jours qui composent la valeur (horaire, entrée et sortie, temps travaillé, retard, événement
 * retenu, valeur du jour si le compteur en a une).
 */
export function DetailPeriode({ compteur, valeur, periode, jours }: { compteur: Compteur; valeur: ValeurAffichee; periode: string; jours: JourDetail[] }) {
  const [estOuverte, setEstOuverte] = useState(false);
  const aValeurJour = compteur.periodicites.includes("JOUR");
  const valeurDuJour = (jour: JourDetail) => jour.valeurs.find((element) => element.idCompteur === compteur.id)?.valeur ?? null;

  return (
    <>
      {/* Bouton étendu à toute la carte (la carte reste un article lisible). */}
      <button type="button" onClick={() => setEstOuverte(true)} aria-label={textes.voirDetail(compteur.nom)} className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primaire" />
      <span className="flex items-center gap-1 text-sm font-semibold text-primaire" aria-hidden="true">
        {textes.voirJours}
        <ChevronRight className="size-4" />
      </span>
      <FenetreModale ouverte={estOuverte} onFermer={() => setEstOuverte(false)} titre={textes.titreDetail(compteur.nom, periode)} libelleFermer={textes.fermer}>
        <div className="flex flex-col gap-4 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-fond p-4">
            <span className="text-sm text-texte-secondaire">{textes.valeurPeriode}</span>
            <span className="text-2xl font-semibold text-marine tabular-nums">{valeur.valeur === null ? textes.nonCalculable : formaterValeur(valeur.valeur, compteur.unite)}</span>
            <p className="w-full font-mono text-sm text-texte-secondaire">{compteur.formule}</p>
          </div>
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-bordure bg-fond/70 text-texte-secondaire">
                <tr>
                  {[colonnes.jour, colonnes.horaire, colonnes.presence, colonnes.travaille, colonnes.retard, colonnes.evenement].map((titre) => (
                    <th key={titre} scope="col" className="px-4 py-2 font-semibold first:ps-5 sm:first:ps-6">{titre}</th>
                  ))}
                  {aValeurJour && <th scope="col" className="px-4 py-2 pe-5 font-semibold sm:pe-6">{textes.valeurDuJour}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {jours.map((jour) => {
                  const nombre = valeurDuJour(jour);
                  return (
                    <tr key={jour.jour} className={jour.profilCode === null ? "bg-fond/60 text-texte-secondaire" : "text-texte"}>
                      <th scope="row" className="whitespace-nowrap px-4 py-2 ps-5 font-medium tabular-nums sm:ps-6">{formaterJour(jour.jour)}</th>
                      <td className="px-4 py-2"><HoraireJour jour={jour} /></td>
                      <td className="px-4 py-2"><PresenceJour jour={jour} /></td>
                      <td className="px-4 py-2"><DureeJour minutes={jour.travailleMinutes} /></td>
                      <td className="px-4 py-2"><DureeJour minutes={jour.retardMinutes} /></td>
                      <td className="px-4 py-2"><EvenementJour jour={jour} /></td>
                      {aValeurJour && (
                        <td className="whitespace-nowrap px-4 py-2 pe-5 font-semibold tabular-nums sm:pe-6">{nombre === null ? <span className="font-normal text-texte-secondaire">{textes.sansValeur}</span> : formaterValeur(nombre, compteur.unite)}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </FenetreModale>
    </>
  );
}
