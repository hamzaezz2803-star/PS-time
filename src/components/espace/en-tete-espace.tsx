import Image from "next/image";
import { LogOut } from "lucide-react";
import { deconnecter } from "@/lib/actions/deconnexion";
import { Bouton } from "@/components/ui/bouton";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { TEXTES_ESPACE } from "@/lib/textes/espace";

/** Barre du haut des pages connectées : logo et déconnexion. */
export function EnTeteEspace() {
  return (
    <header className="border-b border-bordure bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-ps-time.webp"
            alt={TEXTES_CONNEXION.altLogo}
            width={1261}
            height={1247}
            sizes="44px"
            className="size-11"
          />
          <span className="text-lg font-bold text-marine">PS Time</span>
        </div>
        <form action={deconnecter}>
          <Bouton type="submit" variante="contour">
            <LogOut className="size-5" aria-hidden="true" />
            {TEXTES_ESPACE.deconnexion}
          </Bouton>
        </form>
      </div>
    </header>
  );
}
