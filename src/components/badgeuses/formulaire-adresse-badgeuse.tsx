"use client";

import { useState, useTransition, type FormEvent } from "react";
import { LoaderCircle, Plug } from "lucide-react";
import { verifierBadgeuse } from "@/app/(connecte)/appareils/actions";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { estAdressePrivee } from "@/lib/metier/badgeuses/reseau";
import type { EtatBadgeuse } from "@/lib/metier/badgeuses/etat";
import { TEXTES_APPAREILS } from "@/lib/textes/appareils";

const textes = TEXTES_APPAREILS;

/** Badgeuse d'un autre réseau (autre VLAN, autre bâtiment) : testée à partir de son adresse IP. */
export function FormulaireAdresseBadgeuse({ surTrouvee }: { surTrouvee: (etat: EtatBadgeuse) => void }) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string>();

  const envoyer = (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    const adresse = String(new FormData(formulaire).get("adresse-badgeuse") ?? "").trim();
    if (!estAdressePrivee(adresse)) return setErreur(textes.ajout.invalide);
    setErreur(undefined);
    demarrer(async () => {
      try {
        const resultat = await verifierBadgeuse(adresse);
        if (!resultat.ok) return setErreur(resultat.erreur);
        if (resultat.donnees.statut === "injoignable" || resultat.donnees.statut === "non_reconnue") {
          return setErreur(textes.explicationsStatut[resultat.donnees.statut]);
        }
        surTrouvee(resultat.donnees);
        formulaire.reset();
      } catch {
        setErreur(textes.messages.echec);
      }
    });
  };

  return (
    <section aria-labelledby="titre-ajout" className="flex flex-col gap-3 rounded-lg border border-bordure bg-surface p-5 shadow-carte">
      <h2 id="titre-ajout" className="flex items-center gap-2 text-base font-semibold text-marine">
        <Plug className="size-5 text-primaire" aria-hidden="true" />
        {textes.ajout.titre}
      </h2>
      <form onSubmit={envoyer} noValidate className="flex flex-col gap-3">
        <ChampFormulaire
          nom="adresse-badgeuse"
          libelle={textes.ajout.libelle}
          placeholder={textes.ajout.exemple}
          inputMode="decimal"
          autoComplete="off"
          maxLength={15}
          erreur={erreur}
          className="font-mono tabular-nums"
        />
        <Bouton type="submit" variante="contour" disabled={enCours}>
          {enCours && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {textes.ajout.bouton}
        </Bouton>
      </form>
    </section>
  );
}
