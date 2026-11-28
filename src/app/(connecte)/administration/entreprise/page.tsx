import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireEntreprise } from "@/components/entreprise/formulaire-entreprise";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { lireEntreprise, type FicheEntreprise } from "@/lib/donnees/entreprise";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_ENTREPRISE } from "@/lib/textes/entreprise";

export const metadata: Metadata = { title: TEXTES_ENTREPRISE.titrePage };

export default function PageEntreprise() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <EnTetePage titre={TEXTES_ENTREPRISE.titrePage} />
      <Suspense fallback={<Chargement message={TEXTES_ENTREPRISE.chargement} />}>
        <ContenuEntreprise />
      </Suspense>
    </div>
  );
}

async function ContenuEntreprise() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return <MessageErreur message={TEXTES_ENTREPRISE.droits} className="text-base" />;

  let fiche: FicheEntreprise | null;
  try {
    fiche = await lireEntreprise();
  } catch (erreur) {
    console.error("Échec du chargement des informations de l'entreprise", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return <MessageErreur message={TEXTES_ENTREPRISE.echecChargement} className="text-base" />;
  }
  return <FormulaireEntreprise actuelle={fiche} />;
}
