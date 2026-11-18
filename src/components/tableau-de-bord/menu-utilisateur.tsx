"use client";

import Link from "next/link";
import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import { deconnecter } from "@/lib/actions/deconnexion";
import { CHEMIN_CHANGER_MOT_DE_PASSE } from "@/lib/constantes";
import { initiales } from "@/lib/formats";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { useMenuDeroulant } from "@/components/ui/utiliser-menu-deroulant";

const { compte } = TEXTES_NAVIGATION;
const ENTREE =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-texte transition-colors duration-150 hover:bg-canevas focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9";

/** Compte connecté, à droite de la barre du haut : nom, identifiant, mot de passe et déconnexion. */
export function MenuUtilisateur({ nom, identifiant }: { nom: string; identifiant: string }) {
  const { estOuvert, basculer, fermer, conteneur } = useMenuDeroulant();

  return (
    <div ref={conteneur} className="relative shrink-0">
      <button
        type="button"
        onClick={basculer}
        aria-expanded={estOuvert}
        aria-controls="menu-compte"
        aria-label={compte.ouvrir}
        className="flex min-h-11 items-center gap-2 rounded-lg p-1 text-start transition-colors duration-150 hover:bg-canevas focus-visible:outline-2 focus-visible:outline-primaire"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-marine text-sm font-semibold text-white">
          {initiales(nom)}
        </span>
        <span className="hidden max-w-36 min-w-0 2xl:block">
          <span className="block truncate text-sm font-semibold text-texte">{nom}</span>
          <span className="block truncate text-sm text-texte-secondaire">{identifiant}</span>
        </span>
        <ChevronDown className="hidden size-4 shrink-0 text-texte-secondaire sm:block" aria-hidden="true" />
      </button>
      {estOuvert && (
        <div
          id="menu-compte"
          className="absolute end-0 top-full z-50 mt-2 w-64 animate-apparition rounded-lg bg-surface p-1 shadow-flottant ring-1 ring-bordure motion-reduce:animate-none"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-texte">{nom}</p>
            <p className="truncate text-sm text-texte-secondaire">{identifiant}</p>
          </div>
          <div className="my-1 h-px bg-bordure" />
          <Link href={CHEMIN_CHANGER_MOT_DE_PASSE} onClick={fermer} className={ENTREE}>
            <KeyRound className="size-4 text-texte-secondaire" aria-hidden="true" />
            {compte.changerMotDePasse}
          </Link>
          <form action={deconnecter}>
            <button type="submit" className={ENTREE}>
              <LogOut className="size-4 text-texte-secondaire" aria-hidden="true" />
              {compte.deconnexion}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
