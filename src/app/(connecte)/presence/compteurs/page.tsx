import type { Metadata } from "next";
import { Suspense } from "react";
import { FournisseurCodesEvenements } from "@/components/compteurs/contexte-codes";
import { GestionCompteurs } from "@/components/compteurs/gestion-compteurs";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { listerCompteurs } from "@/lib/donnees/compteurs";
import { listerCodesCompteurs } from "@/lib/donnees/compteurs-contexte";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";

export const metadata: Metadata = { title: textes.titrePage };

export default function PageCompteurs() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} />
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <ContenuCompteurs />
      </Suspense>
    </div>
  );
}

async function ContenuCompteurs() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "compteurs")) return <MessageErreur message={textes.droits} className="text-base" />;
  const [compteurs, codes] = await Promise.all([listerCompteurs(), listerCodesCompteurs()]);
  return (
    <FournisseurCodesEvenements liste={codes}>
      <GestionCompteurs compteurs={compteurs} />
    </FournisseurCodesEvenements>
  );
}
