"use client";

import { useState, useTransition, type ReactNode } from "react";
import { LoaderCircle, Radar, SearchX } from "lucide-react";
import { rechercherBadgeusesDuReseau } from "@/app/(connecte)/appareils/actions";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { formaterHeure } from "@/lib/formats";
import { fusionnerBadgeuse, trierBadgeuses, type EtatBadgeuse } from "@/lib/metier/badgeuses/etat";
import { TEXTES_APPAREILS } from "@/lib/textes/appareils";
import { CarteBadgeuse } from "./carte-badgeuse";
import { ExempleBadgeuse } from "./exemple-badgeuse";
import { FormulaireAdresseBadgeuse } from "./formulaire-adresse-badgeuse";

const textes = TEXTES_APPAREILS;

/**
 * Recherche et liste des badgeuses. Rien n'est enregistré : la liste vit dans la page et
 * se relit sur le réseau à chaque recherche.
 */
export function GestionBadgeuses({ rechercheImpossible, panneaux }: { rechercheImpossible: boolean; panneaux: ReactNode }) {
  const [badgeuses, setBadgeuses] = useState<EtatBadgeuse[]>([]);
  const [derniere, setDerniere] = useState<Date | null>(null);
  const [erreur, setErreur] = useState<string>();
  const [enCours, demarrer] = useTransition();

  const rechercher = () => {
    setErreur(undefined);
    demarrer(async () => {
      try {
        const resultat = await rechercherBadgeusesDuReseau();
        if (!resultat.ok) return setErreur(resultat.erreur);
        setBadgeuses(resultat.donnees.badgeuses);
        setDerniere(new Date());
      } catch {
        setErreur(textes.recherche.echec);
      }
    });
  };

  const mettreAJour = (etat: EtatBadgeuse) => setBadgeuses((actuelles) => trierBadgeuses(fusionnerBadgeuse(actuelles, etat)));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section aria-labelledby="titre-liste" className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg border border-bordure bg-surface p-4 shadow-carte sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-col gap-1">
            <h2 id="titre-liste" className="text-lg font-semibold text-marine">
              {textes.liste.titre}
            </h2>
            <p className="text-sm text-texte-secondaire" aria-live="polite">
              {enCours ? textes.recherche.enCours : derniere ? `${textes.recherche.resultat(badgeuses.length)} ${textes.recherche.derniere(formaterHeure(derniere))}` : textes.vide.avant}
            </p>
          </div>
          <Bouton onClick={rechercher} disabled={enCours || rechercheImpossible} className="w-full sm:w-auto">
            {enCours ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Radar className="size-4" aria-hidden="true" />}
            {derniere ? textes.recherche.relancer : textes.recherche.bouton}
          </Bouton>
        </div>

        <MessageErreur message={erreur} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3 text-base" />

        {enCours && badgeuses.length === 0 ? (
          <EtatRecherche />
        ) : badgeuses.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-busy={enCours}>
            {badgeuses.map((badgeuse) => (
              <CarteBadgeuse key={badgeuse.adresse} badgeuse={badgeuse} surMiseAJour={mettreAJour} />
            ))}
          </ul>
        ) : (
          <>
            <EtatVide apresRecherche={derniere !== null} />
            <ExempleBadgeuse />
          </>
        )}
      </section>

      <aside className="flex flex-col gap-4">
        {panneaux}
        <FormulaireAdresseBadgeuse surTrouvee={mettreAJour} />
      </aside>
    </div>
  );
}

function EtatRecherche() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-bordure-champ bg-surface px-6 py-12 text-center">
      <LoaderCircle className="size-8 animate-spin text-primaire motion-reduce:animate-none" aria-hidden="true" />
      <p className="text-base font-semibold text-marine">{textes.recherche.enCours}</p>
      <p className="max-w-prose text-sm text-texte-secondaire">{textes.recherche.enCoursDetail}</p>
    </div>
  );
}

function EtatVide({ apresRecherche }: { apresRecherche: boolean }) {
  const Icone = apresRecherche ? SearchX : Radar;
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-bordure-champ bg-surface px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-ciel text-primaire">
        <Icone className="size-6" aria-hidden="true" />
      </span>
      <p className="text-lg font-semibold text-marine">{apresRecherche ? textes.vide.apres : textes.vide.avant}</p>
      {apresRecherche ? (
        <ul className="flex max-w-prose flex-col gap-2 text-start text-sm text-texte-secondaire">
          {textes.vide.conseils.map((conseil) => (
            <li key={conseil} className="list-inside list-disc">
              {conseil}
            </li>
          ))}
        </ul>
      ) : (
        <p className="max-w-prose text-sm text-texte-secondaire">{textes.vide.avantDetail}</p>
      )}
    </div>
  );
}
