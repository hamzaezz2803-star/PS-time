import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionPostes } from "@/components/postes/gestion-postes";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { compterEmployesParPoste } from "@/lib/donnees/employes";
import { listerPostes } from "@/lib/donnees/postes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_POSTES } from "@/lib/textes/postes";

export const metadata: Metadata = { title: TEXTES_POSTES.titrePage };

export default function PagePostes() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={TEXTES_POSTES.titrePage} sousTitre={TEXTES_POSTES.sousTitre} />
      <Suspense fallback={<Chargement message={TEXTES_POSTES.chargement} />}>
        <ContenuPostes />
      </Suspense>
    </div>
  );
}

async function ContenuPostes() {
  await obtenirUtilisateurPourEspace();
  const [postes, nombresEmployes] = await Promise.all([listerPostes(), compterEmployesParPoste()]);
  return <GestionPostes postes={postes} nombresEmployes={nombresEmployes} />;
}
