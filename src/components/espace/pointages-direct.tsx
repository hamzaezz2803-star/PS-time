"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Coffee, Fingerprint, LogIn, LogOut, PenLine, Timer, type LucideIcon } from "lucide-react";
import { lireDerniersPointages } from "@/app/(connecte)/espace/actions";
import { CHEMIN_POINTAGES_MANUELS, INTERVALLE_DIRECT_MS, POINTAGES_DIRECT_MAX } from "@/lib/constantes";
import { formaterHeure, initiales } from "@/lib/formats";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";
import { cn } from "@/lib/utils";
import type { PointageDirect } from "@/types";

const textes = TEXTES_PRESENCE.direct;
const ETATS = TEXTES_EXCEPTIONS.pointages.etats;
const MILLISECONDES_PAR_MINUTE = 60_000;

/** Icône et teinte de chaque état (le libellé est toujours écrit à côté). */
const APPARENCE: Record<string, { Icone: LucideIcon; teinte: string }> = {
  entree: { Icone: LogIn, teinte: "bg-succes/10 text-succes" },
  sortie: { Icone: LogOut, teinte: "bg-primaire/10 text-primaire" },
  debut_pause: { Icone: Coffee, teinte: "bg-attention/10 text-attention" },
  fin_pause: { Icone: Coffee, teinte: "bg-attention/10 text-attention" },
  debut_heures_sup: { Icone: Timer, teinte: "bg-accent/15 text-marine" },
  fin_heures_sup: { Icone: Timer, teinte: "bg-accent/15 text-marine" },
};

type Ligne = PointageDirect & { estExemple?: boolean };

/** Lignes d'exemple (présentation), placées quelques minutes avant maintenant. Jamais enregistrées. */
const EXEMPLES: { nomComplet: string; departement: string; etat: string; ilYaMinutes: number }[] = [
  { nomComplet: "Imane Rami", departement: "Atelier A", etat: "entree", ilYaMinutes: 2 },
  { nomComplet: "Karim Tahiri", departement: "Logistique", etat: "debut_pause", ilYaMinutes: 6 },
  { nomComplet: "Leila Mernissi", departement: "Comptabilité", etat: "entree", ilYaMinutes: 11 },
  { nomComplet: "Omar Squalli", departement: "Atelier B", etat: "sortie", ilYaMinutes: 19 },
  { nomComplet: "Sara Kabbaj", departement: "Ressources humaines", etat: "fin_pause", ilYaMinutes: 27 },
  { nomComplet: "Hamid Zerouali", departement: "Atelier A", etat: "entree", ilYaMinutes: 34 },
];

/** Complète les vrais pointages par des exemples tant qu'il y en a moins que la carte n'en montre. */
function avecExemples(reels: PointageDirect[], maintenant: number): Ligne[] {
  const manquants = EXEMPLES.slice(0, Math.max(0, POINTAGES_DIRECT_MAX - reels.length)).map((exemple, rang) => ({
    id: `exemple-${rang}`,
    nomComplet: exemple.nomComplet,
    departement: exemple.departement,
    etat: exemple.etat,
    source: "badgeuse",
    horodatage: new Date(maintenant - exemple.ilYaMinutes * MILLISECONDES_PAR_MINUTE),
    estExemple: true,
  }));
  return [...reels, ...manquants];
}

function LignePointage({ ligne, maintenant }: { ligne: Ligne; maintenant: number }) {
  const { Icone, teinte } = APPARENCE[ligne.etat] ?? APPARENCE.entree;
  const libelleEtat = ETATS[ligne.etat as keyof typeof ETATS] ?? ligne.etat;
  const estBadgeuse = ligne.source === "badgeuse";
  const SourceIcone = estBadgeuse ? Fingerprint : PenLine;
  const minutes = Math.max(0, Math.floor((maintenant - ligne.horodatage.getTime()) / MILLISECONDES_PAR_MINUTE));
  return (
    <li className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", ligne.estExemple && "bg-fond/60")}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ciel text-sm font-semibold text-marine" aria-hidden="true">
        {initiales(ligne.nomComplet)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="truncate text-base font-medium text-texte">{ligne.nomComplet}</span>
          {ligne.estExemple && (
            <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-texte-secondaire ring-1 ring-inset ring-bordure" title={textes.aideExemple}>
              {textes.exemple}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5 truncate text-sm text-texte-secondaire">
          <SourceIcone className="size-3.5 shrink-0" aria-hidden="true" />
          {ligne.estExemple ? textes.badgeuseExemple : estBadgeuse ? textes.sources.badgeuse : textes.sources.manuel}
          <span aria-hidden="true">·</span>
          <span className="truncate">{ligne.departement}</span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-medium", teinte)}>
          <Icone className="size-3.5" aria-hidden="true" />
          {libelleEtat}
        </span>
        <span className="text-sm tabular-nums text-texte-secondaire">
          <time dateTime={ligne.horodatage.toISOString()}>{formaterHeure(ligne.horodatage)}</time>
          <span className="hidden sm:inline"> · {textes.ilYA(minutes)}</span>
        </span>
      </span>
    </li>
  );
}

/**
 * Derniers pointages, actualisés toutes les 15 secondes tant que la page est visible.
 * Les vrais pointages (badgeuse ou saisie manuelle) passent toujours en premier ; des lignes
 * « Exemple » complètent la carte pour la présentation tant qu'il y en a peu.
 */
export function PointagesDirect({ initiaux }: { initiaux: PointageDirect[] }) {
  const [reels, setReels] = useState(initiaux);
  const [maintenant, setMaintenant] = useState<number | null>(null);
  const [aUneErreur, setAUneErreur] = useState(false);

  useEffect(() => {
    let estActif = true;
    const actualiser = async () => {
      if (document.visibilityState !== "visible") return;
      const resultat = await lireDerniersPointages();
      if (!estActif) return;
      setAUneErreur(!resultat.ok);
      if (resultat.ok) setReels(resultat.donnees);
      setMaintenant(Date.now());
    };
    void actualiser();
    const minuterie = setInterval(actualiser, INTERVALLE_DIRECT_MS);
    return () => {
      estActif = false;
      clearInterval(minuterie);
    };
  }, []);

  const lignes = maintenant === null ? reels : avecExemples(reels, maintenant);

  return (
    <section aria-labelledby="titre-direct" className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-surface shadow-carte">
      <div className="flex items-start justify-between gap-3 border-b border-bordure px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 id="titre-direct" className="text-lg font-semibold text-marine">{textes.titre}</h2>
          <p className="text-sm text-texte-secondaire">{textes.sousTitre}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-md bg-succes/10 px-2 py-1 text-sm font-medium text-succes" title={textes.actualisation}>
          <span className="relative flex size-2.5" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-succes opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2.5 rounded-full bg-succes" />
          </span>
          {textes.enDirect}
        </span>
      </div>

      {lignes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <Fingerprint className="size-8 text-primaire" aria-hidden="true" />
          <p className="text-base font-semibold text-texte">{textes.vide}</p>
          <p className="max-w-xs text-sm text-texte-secondaire">{textes.videAide}</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-bordure">
          {lignes.map((ligne) => (
            <LignePointage key={ligne.id} ligne={ligne} maintenant={maintenant ?? ligne.horodatage.getTime()} />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-bordure px-4 py-3 text-sm sm:px-5">
        <span className={cn("tabular-nums", aUneErreur ? "text-erreur" : "text-texte-secondaire")} role={aUneErreur ? "alert" : undefined}>
          {aUneErreur ? textes.erreur : maintenant !== null ? textes.misAJour(formaterHeure(new Date(maintenant))) : textes.actualisation}
        </span>
        <Link href={CHEMIN_POINTAGES_MANUELS} className="inline-flex min-h-11 items-center gap-1 font-medium text-primaire hover:underline">
          {textes.voirTout}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
