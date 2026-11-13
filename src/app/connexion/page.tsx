import type { Metadata } from "next";
import Image from "next/image";
import { FormulaireConnexion } from "@/components/connexion/formulaire-connexion";
import { PanneauMarque } from "@/components/connexion/panneau-marque";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";

export const metadata: Metadata = {
  title: TEXTES_CONNEXION.titrePage,
};

export default function PageConnexion() {
  return (
    <div className="flex min-h-dvh">
      <PanneauMarque />

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Image
            src="/logo-ps-time.webp"
            alt={TEXTES_CONNEXION.altLogo}
            width={1261}
            height={1247}
            priority
            className="mx-auto mb-6 size-24 lg:hidden"
          />

          <div className="rounded-xl border border-bordure bg-surface p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold text-marine sm:text-3xl">
              {TEXTES_CONNEXION.titre}
            </h1>
            <p className="mb-8 mt-2 text-base text-texte-secondaire">
              {TEXTES_CONNEXION.sousTitre}
            </p>
            <FormulaireConnexion />
          </div>

          <p className="mt-6 text-center text-sm text-texte-secondaire">
            {TEXTES_CONNEXION.aide}
          </p>
        </div>
      </main>
    </div>
  );
}
