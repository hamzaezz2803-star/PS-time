import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionDepartements } from "@/components/departements/gestion-departements";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { listerDepartements } from "@/lib/donnees/departements";
import { compterEmployesParDepartement } from "@/lib/donnees/employes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { listerOptionsSites } from "@/lib/donnees/sites";
import { TEXTES_DEPARTEMENTS } from "@/lib/textes/departements";

export const metadata: Metadata = { title: TEXTES_DEPARTEMENTS.titrePage };

export default function PageDepartements() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={TEXTES_DEPARTEMENTS.titrePage} />
      <Suspense fallback={<Chargement message={TEXTES_DEPARTEMENTS.chargement} />}>
        <ContenuDepartements />
      </Suspense>
    </div>
  );
}

async function ContenuDepartements() {
  await obtenirUtilisateurPourEspace();
  const [departements, nombresEmployes, sites] = await Promise.all([
    listerDepartements(),
    compterEmployesParDepartement(),
    listerOptionsSites(),
  ]);
  return <GestionDepartements departements={departements} nombresEmployes={nombresEmployes} sites={sites} />;
}
