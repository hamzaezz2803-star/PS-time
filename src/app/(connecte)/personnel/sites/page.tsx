import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionSites } from "@/components/sites/gestion-sites";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { listerSites } from "@/lib/donnees/sites";
import { TEXTES_SITES } from "@/lib/textes/sites";

export const metadata: Metadata = { title: TEXTES_SITES.titrePage };

export default function PageSites() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={TEXTES_SITES.titrePage} />
      <Suspense fallback={<Chargement message={TEXTES_SITES.chargement} />}>
        <ContenuSites />
      </Suspense>
    </div>
  );
}

async function ContenuSites() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "sites")) return <MessageErreur message={TEXTES_SITES.droits} className="text-base" />;
  return <GestionSites sites={await listerSites()} />;
}
