import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionUtilisateurs } from "@/components/utilisateurs/gestion-utilisateurs";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { listerUtilisateurs } from "@/lib/donnees/utilisateurs";
import { TEXTES_UTILISATEURS } from "@/lib/textes/utilisateurs";

export const metadata: Metadata = { title: TEXTES_UTILISATEURS.titrePage };

export default function PageUtilisateurs() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={TEXTES_UTILISATEURS.titrePage} sousTitre={TEXTES_UTILISATEURS.sousTitre} />
      <Suspense fallback={<Chargement message={TEXTES_UTILISATEURS.chargement} />}>
        <ContenuUtilisateurs />
      </Suspense>
    </div>
  );
}

async function ContenuUtilisateurs() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return <MessageErreur message={TEXTES_UTILISATEURS.droits} className="text-base" />;
  return <GestionUtilisateurs utilisateurs={await listerUtilisateurs()} idConnecte={utilisateur.id} />;
}
