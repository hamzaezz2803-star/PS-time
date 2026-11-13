import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionDepartements } from "@/components/departements/gestion-departements";
import { Chargement } from "@/components/ui/chargement";
import { listerDepartements } from "@/lib/donnees/departements";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";

export const metadata: Metadata = { title: TEXTES_DEPARTEMENTS.titrePage };

export default function PageDepartements() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marine sm:text-[1.75rem]">
          {TEXTES_DEPARTEMENTS.titrePage}
        </h1>
        <p className="mt-1.5 max-w-2xl text-base text-texte-secondaire">
          {TEXTES_DEPARTEMENTS.sousTitre}
        </p>
      </div>
      <Suspense fallback={<Chargement message={TEXTES_DEPARTEMENTS.chargement} />}>
        <ContenuDepartements />
      </Suspense>
    </div>
  );
}

async function ContenuDepartements() {
  await obtenirUtilisateurPourEspace();
  const departements = await listerDepartements();
  return <GestionDepartements departements={departements} />;
}
