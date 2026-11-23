import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_APPAREILS as textes } from "@/lib/textes/appareils";

export const metadata: Metadata = { title: textes.titrePage };

/** Appareils > Badgeuses : page d'attente, réservée au super administrateur (vérifié ici, pas seulement dans le menu). */
export default async function PageAppareils() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} sousTitre={textes.sousTitre} />
      {utilisateur.estSuperAdmin ? (
        <section className="flex flex-col items-center gap-3 rounded-lg border border-bordure bg-surface px-6 py-12 text-center shadow-carte">
          <span className="flex size-12 items-center justify-center rounded-lg bg-ciel text-primaire">
            <ScanLine className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-marine">{textes.vide}</h2>
          <p className="max-w-prose text-base text-texte-secondaire">{textes.videExplication}</p>
        </section>
      ) : (
        <MessageErreur message={textes.droits} className="text-base" />
      )}
    </div>
  );
}
