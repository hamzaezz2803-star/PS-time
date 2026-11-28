import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionBadgeuses } from "@/components/badgeuses/gestion-badgeuses";
import { PanneauReseau } from "@/components/badgeuses/panneau-reseau";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PORT_BADGEUSE } from "@/lib/constantes";
import { reseauxDuServeur } from "@/lib/donnees/badgeuses";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_APPAREILS as textes } from "@/lib/textes/appareils";

export const metadata: Metadata = { title: textes.titrePage };

/** Appareils > Badgeuses : détection sur le réseau local et synchronisation, rien en base. */
export default function PageAppareils() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} />
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <ContenuAppareils />
      </Suspense>
    </div>
  );
}

async function ContenuAppareils() {
  // Réservé au super administrateur : vérifié ici et dans chaque action, jamais seulement dans le menu.
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return <MessageErreur message={textes.droits} className="text-base" />;
  const reseaux = reseauxDuServeur();
  return <GestionBadgeuses rechercheImpossible={reseaux.length === 0} panneaux={<PanneauReseau reseaux={reseaux} />} />;
}
