import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireApparence } from "@/components/apparence/formulaire-apparence";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { lireApparence } from "@/lib/donnees/apparence";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_APPARENCE } from "@/lib/textes/apparence";

export const metadata: Metadata = { title: TEXTES_APPARENCE.titrePage };

export default function PageApparence() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={TEXTES_APPARENCE.titrePage} sousTitre={TEXTES_APPARENCE.sousTitre} />
      <Suspense fallback={<Chargement message={TEXTES_APPARENCE.chargement} />}>
        <ContenuApparence />
      </Suspense>
    </div>
  );
}

async function ContenuApparence() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return <MessageErreur message={TEXTES_APPARENCE.droits} className="text-base" />;
  return <FormulaireApparence actuelle={await lireApparence()} />;
}
