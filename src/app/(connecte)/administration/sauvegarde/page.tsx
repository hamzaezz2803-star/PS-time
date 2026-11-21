import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { ExportSauvegarde } from "@/components/sauvegarde/export-sauvegarde";
import { ImportSauvegarde } from "@/components/sauvegarde/import-sauvegarde";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_SAUVEGARDE as textes } from "@/lib/textes/sauvegarde";

export const metadata: Metadata = { title: textes.titrePage };

export default function PageSauvegarde() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} sousTitre={textes.sousTitre} />
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <ContenuSauvegarde />
      </Suspense>
    </div>
  );
}

async function ContenuSauvegarde() {
  // Réservé au super administrateur : vérifié ici et dans chaque route, jamais seulement dans le menu.
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return <MessageErreur message={textes.droits} className="text-base" />;
  return (
    <>
      <p className="flex items-start gap-3 rounded-lg border border-attention/40 bg-attention/5 p-4 text-base text-texte">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-attention" aria-hidden="true" />
        <span>{textes.confidentiel}</span>
      </p>
      <ExportSauvegarde />
      <ImportSauvegarde />
    </>
  );
}
