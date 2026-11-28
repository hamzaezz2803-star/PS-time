"use client";

import { useState, useSyncExternalStore } from "react";
import { heureEnChiffres } from "@/lib/formats";
import { cn } from "@/lib/utils";

const MILLISECONDES_PAR_SECONDE = 1000;
/** Vérifie souvent pour changer de seconde sans retard visible. */
const INTERVALLE_VERIFICATION_MS = 250;

function abonner(rappel: () => void) {
  const minuterie = setInterval(rappel, INTERVALLE_VERIFICATION_MS);
  return () => clearInterval(minuterie);
}
// La seconde en cours : l'horloge ne se réaffiche qu'une fois par seconde.
const secondeActuelle = () => Math.floor(Date.now() / MILLISECONDES_PAR_SECONDE);
// Rien côté serveur : l'heure n'est affichée qu'une fois dans le navigateur (pas d'écart à l'hydratation).
const secondeServeur = () => null;

const CARTE = "relative h-12 w-8 overflow-hidden rounded-md text-3xl shadow-survol perspective-[400px] sm:h-16 sm:w-11 sm:text-5xl";
const MOITIE = "absolute inset-x-0 h-1/2 overflow-hidden";

/** Couleurs : cartes marine sur un fond clair (par défaut), cartes blanches sur un fond marine. */
const TEINTES = {
  clair: { carte: "bg-marine text-white", moitie: "bg-marine", pliure: "bg-white/15", separateur: "text-marine/40", attente: "bg-canevas" },
  sombre: { carte: "bg-white text-marine", moitie: "bg-white", pliure: "bg-marine/15", separateur: "text-white/50", attente: "bg-white/10" },
} as const;
type Teinte = keyof typeof TEINTES;

/** Chiffre centré sur toute la hauteur de la carte ; la moitié visible dépend de la position. */
function Chiffre({ valeur, position }: { valeur: string; position: "haut" | "bas" }) {
  return (
    <span className={cn("absolute inset-x-0 flex h-[200%] items-center justify-center", position === "haut" ? "top-0" : "-top-full")}>
      {valeur}
    </span>
  );
}

/**
 * Une palette : au changement de chiffre, la moitié haute de l'ancien tombe puis la moitié basse
 * du nouveau se rabat. Sans animation (réglage « réduire les animations »), le chiffre change d'un coup.
 */
function Palette({ chiffre, teinte }: { chiffre: string; teinte: Teinte }) {
  const couleurs = TEINTES[teinte];
  // Valeur précédente gardée pendant le rendu (modèle React recommandé, sans effet ni minuterie).
  const [etat, setEtat] = useState({ actuel: chiffre, precedent: chiffre, tour: 0 });
  if (etat.actuel !== chiffre) setEtat({ actuel: chiffre, precedent: etat.actuel, tour: etat.tour + 1 });

  return (
    <span className={cn(CARTE, couleurs.carte)}>
      <span className={cn(MOITIE, couleurs.moitie, "top-0 rounded-t-md")}><Chiffre valeur={chiffre} position="haut" /></span>
      <span className={cn(MOITIE, couleurs.moitie, "top-1/2 rounded-b-md")}><Chiffre valeur={chiffre} position="bas" /></span>
      {etat.tour > 0 && (
        <span key={etat.tour} className="motion-reduce:hidden">
          <span className={cn(MOITIE, couleurs.moitie, "top-1/2 rounded-b-md")}><Chiffre valeur={etat.precedent} position="bas" /></span>
          <span className={cn(MOITIE, couleurs.moitie, "top-0 z-20 origin-bottom rounded-t-md backface-hidden animate-palette-haut")}>
            <Chiffre valeur={etat.precedent} position="haut" />
          </span>
          <span className={cn(MOITIE, couleurs.moitie, "top-1/2 z-10 origin-top rounded-b-md backface-hidden animate-palette-bas")}>
            <Chiffre valeur={chiffre} position="bas" />
          </span>
        </span>
      )}
      {/* Pliure au milieu de la carte. */}
      <span className={cn("absolute inset-x-0 top-1/2 z-30 h-px -translate-y-1/2", couleurs.pliure)} />
    </span>
  );
}

function Groupe({ valeur, teinte }: { valeur: string; teinte: Teinte }) {
  return (
    <span className="flex gap-1">
      {valeur.split("").map((chiffre, rang) => (
        <Palette key={rang} chiffre={chiffre} teinte={teinte} />
      ))}
    </span>
  );
}

const Separateur = ({ teinte }: { teinte: Teinte }) => <span className={cn("text-3xl font-semibold sm:text-5xl", TEINTES[teinte].separateur)}>:</span>;

/** Horloge à palettes (heures, minutes, secondes) à l'heure de Casablanca. */
export function HorlogePalettes({ libelle, teinte = "clair", className }: { libelle: string; teinte?: Teinte; className?: string }) {
  const seconde = useSyncExternalStore(abonner, secondeActuelle, secondeServeur);

  if (seconde === null) {
    return <span className={cn("block h-12 w-64 animate-pulse rounded-md motion-reduce:animate-none sm:h-16 sm:w-96", TEINTES[teinte].attente, className)} aria-hidden="true" />;
  }
  const maintenant = new Date(seconde * MILLISECONDES_PAR_SECONDE);
  const { heures, minutes, secondes } = heureEnChiffres(maintenant);

  return (
    // role="timer" : lu à la demande, sans annoncer chaque seconde aux lecteurs d'écran.
    <div role="timer" aria-label={`${libelle} : ${heures}:${minutes}`} className={cn("flex items-center gap-1.5 font-semibold tabular-nums sm:gap-2", className)}>
      <span aria-hidden="true" className="contents">
        <Groupe valeur={heures} teinte={teinte} />
        <Separateur teinte={teinte} />
        <Groupe valeur={minutes} teinte={teinte} />
        <Separateur teinte={teinte} />
        <Groupe valeur={secondes} teinte={teinte} />
      </span>
    </div>
  );
}
