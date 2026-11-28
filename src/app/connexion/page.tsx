import type { Metadata } from "next";
import { Suspense } from "react";
import { EntrepriseConnexion } from "@/components/connexion/entreprise-connexion";
import { FormulaireConnexion } from "@/components/connexion/formulaire-connexion";
import { MessageMotDePasseChange } from "@/components/connexion/message-mot-de-passe-change";
import { PanneauMarque } from "@/components/connexion/panneau-marque";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";

export const metadata: Metadata = {
  title: TEXTES_CONNEXION.titrePage,
};

export default function PageConnexion() {
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-canevas px-4 py-8 sm:px-8">
      {/* Disques décoratifs du fond, aux couleurs du thème. */}
      <span
        className="absolute -start-24 -top-24 -z-10 size-80 rounded-full bg-primaire/10"
        aria-hidden="true"
      />
      <span
        className="absolute -bottom-32 -end-20 -z-10 size-96 rounded-full bg-accent/10"
        aria-hidden="true"
      />

      <main className="grid w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-flottant lg:min-h-[36rem] lg:max-w-5xl lg:grid-cols-2">
        <PanneauMarque />

        <section className="relative flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-12 lg:has-data-entreprise:pt-36 xl:has-data-entreprise:pt-40">
          <EntrepriseConnexion />
          <h1 className="mb-8 text-2xl font-bold tracking-tight text-marine sm:text-3xl">
            {TEXTES_CONNEXION.titre}
          </h1>
          <Suspense>
            <MessageMotDePasseChange />
          </Suspense>
          <FormulaireConnexion />

          <p className="mt-8 border-t border-bordure pt-5 text-center text-sm text-texte-secondaire">
            {TEXTES_CONNEXION.aide}
          </p>
        </section>
      </main>
    </div>
  );
}
