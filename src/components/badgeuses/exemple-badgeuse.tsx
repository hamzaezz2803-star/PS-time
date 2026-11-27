"use client";

import { useState } from "react";
import { Eye, EyeOff, FlaskConical } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { FUSEAU_HORAIRE } from "@/lib/constantes";
import type { EtatBadgeuse } from "@/lib/metier/badgeuses/etat";
import { badgeuseExemple } from "@/lib/metier/badgeuses/exemple";
import { TEXTES_APPAREILS } from "@/lib/textes/appareils";
import { CarteBadgeuse } from "./carte-badgeuse";

const { exemple: textes } = TEXTES_APPAREILS;

/**
 * Exemple de détection, affiché seulement sur demande et sous un bandeau « Démonstration »
 * (règle : aucune fausse donnée présentée comme réelle). Rien n'est envoyé au serveur.
 */
export function ExempleBadgeuse() {
  const [badgeuse, setBadgeuse] = useState<EtatBadgeuse | null>(null);

  if (!badgeuse) {
    return (
      <Bouton variante="fantome" onClick={() => setBadgeuse(badgeuseExemple(new Date(), FUSEAU_HORAIRE))} className="self-center">
        <Eye className="size-4" aria-hidden="true" />
        {textes.voir}
      </Bouton>
    );
  }

  return (
    <section aria-labelledby="titre-exemple" className="flex flex-col gap-3 rounded-lg border border-dashed border-primaire/40 bg-ciel/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-prose flex-col gap-1">
          <h3 id="titre-exemple" className="flex items-center gap-2 text-base font-semibold text-marine">
            <FlaskConical className="size-5 text-primaire" aria-hidden="true" />
            {textes.titre}
          </h3>
          <p className="text-sm text-texte">{textes.avertissement}</p>
        </div>
        <Bouton variante="fantome" onClick={() => setBadgeuse(null)}>
          <EyeOff className="size-4" aria-hidden="true" />
          {textes.masquer}
        </Bouton>
      </div>
      <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CarteBadgeuse badgeuse={badgeuse} surMiseAJour={setBadgeuse} estExemple />
      </ul>
    </section>
  );
}
