import type { Metadata } from "next";
import { Suspense } from "react";
import { ScanLine } from "lucide-react";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_APPAREILS as textes } from "@/lib/textes/appareils";

export const metadata: Metadata = { title: textes.titrePage };

/** Appareils > Badgeuses : page d'attente tant que la gestion des badgeuses n'existe pas. */
export default function PageAppareils() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} sousTitre={textes.sousTitre} />
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <ContenuAppareils />
      </Suspense>
    </div>
  );
}

async function ContenuAppareils() {
  // Réservé au super administrateur : vérifié ici, jamais seulement dans le menu.
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return <MessageErreur message={textes.droits} className="text-base" />;
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-bordure bg-surface px-6 py-12 text-center shadow-carte">
      <span className="flex size-12 items-center justify-center rounded-lg bg-ciel text-primaire">
        <ScanLine className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-marine">{textes.vide}</h2>
      <p className="max-w-prose text-base text-texte-secondaire">{textes.videExplication}</p>
    </section>
  );
}
