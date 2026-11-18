import type { Metadata } from "next";
import { Suspense } from "react";
import { FiltresHistorique } from "@/components/historique/filtres-historique";
import { ListeHistorique } from "@/components/historique/liste-historique";
import { PaginationHistorique } from "@/components/historique/pagination-historique";
import { ResumeHistorique } from "@/components/historique/resume-historique";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { chargerHistorique, listerAuteursHistorique, type PageHistorique } from "@/lib/donnees/historique";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_HISTORIQUE as textes } from "@/lib/textes/historique";
import { lireRechercheHistorique } from "@/lib/validation/historique";

export const metadata: Metadata = { title: textes.titrePage };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PageHistorique({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} sousTitre={textes.sousTitre} />
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <ContenuHistorique searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ContenuHistorique({ searchParams }: { searchParams: ParametresRecherche }) {
  // Réservé au super administrateur : vérifié ici, jamais seulement dans le menu.
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return <MessageErreur message={textes.droits} className="text-base" />;

  const aujourdhui = aujourdhuiLocal();
  const recherche = lireRechercheHistorique(await searchParams, aujourdhui);
  let donnees: PageHistorique;
  let auteurs: Awaited<ReturnType<typeof listerAuteursHistorique>>;
  try {
    [donnees, auteurs] = await Promise.all([chargerHistorique(recherche), listerAuteursHistorique()]);
  } catch (erreur) {
    console.error("Échec du chargement de l'historique", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return <MessageErreur message={textes.echec} className="text-base" />;
  }
  const page = { ...recherche, page: donnees.page };

  return (
    <>
      <ResumeHistorique resume={donnees.resume} recherche={page} />
      <FiltresHistorique recherche={page} auteurs={auteurs} aujourdhui={aujourdhui} />
      <section aria-labelledby="titre-actions" className="flex flex-col gap-4">
        <h2 id="titre-actions" className="flex items-baseline gap-2 text-lg font-semibold text-marine">
          {textes.liste.titre}
          <span className="text-sm font-medium tabular-nums text-texte-secondaire">{textes.liste.total(donnees.total)}</span>
        </h2>
        <ListeHistorique entrees={donnees.entrees} aujourdhui={aujourdhui} />
        <PaginationHistorique recherche={page} page={donnees.page} pages={donnees.pages} total={donnees.total} />
      </section>
    </>
  );
}
