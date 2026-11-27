import type { Metadata } from "next";
import { Suspense } from "react";
import { CouleursPlanning } from "@/components/apparence/couleurs-planning";
import { FormulaireApparence } from "@/components/apparence/formulaire-apparence";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { lireApparence } from "@/lib/donnees/apparence";
import { listerCodesAColorer } from "@/lib/donnees/couleurs-planning";
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
  return (
    <>
      <FormulaireApparence actuelle={await lireApparence()} />
      <Suspense fallback={<Chargement message={TEXTES_APPARENCE.chargement} />}>
        <ContenuCouleursPlanning />
      </Suspense>
    </>
  );
}

/** Couleurs du planning, sous les réglages : un échec de lecture n'empêche pas de régler le reste. */
async function ContenuCouleursPlanning() {
  try {
    return <CouleursPlanning codes={await listerCodesAColorer()} />;
  } catch (erreur) {
    console.error("Échec du chargement des couleurs du planning", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return <MessageErreur message={TEXTES_APPARENCE.couleursPlanning.echecChargement} className="text-base" />;
  }
}
