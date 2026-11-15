import type { Metadata } from "next";
import { Suspense } from "react";
import { EnTeteEspace } from "@/components/espace/en-tete-espace";
import { FormulaireMotDePasse } from "@/components/espace/formulaire-mot-de-passe";
import { Chargement } from "@/components/ui/chargement";
import { obtenirUtilisateurConnecte } from "@/lib/donnees/session";
import { TEXTES_MOT_DE_PASSE } from "@/lib/textes/espace";

export const metadata: Metadata = { title: TEXTES_MOT_DE_PASSE.titrePage };

export default function PageChangerMotDePasse() {
  return (
    <div className="flex min-h-dvh flex-col">
      <EnTeteEspace />
      <main className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-bordure bg-surface shadow-carte p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-marine">
            {TEXTES_MOT_DE_PASSE.titre}
          </h1>
          <Suspense fallback={<Chargement message={TEXTES_MOT_DE_PASSE.chargement} />}>
            <ContenuChangement />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function ContenuChangement() {
  const utilisateur = await obtenirUtilisateurConnecte();
  return (
    <>
      <p className="mb-8 mt-2 text-base text-texte-secondaire">
        {utilisateur.doitChangerMotDePasse
          ? TEXTES_MOT_DE_PASSE.obligatoire
          : TEXTES_MOT_DE_PASSE.volontaire}
      </p>
      <FormulaireMotDePasse />
    </>
  );
}
