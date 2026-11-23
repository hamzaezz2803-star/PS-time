import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { BoutonImprimer } from "@/components/personnes/bouton-imprimer";
import { Chargement } from "@/components/ui/chargement";
import { MessageErreur } from "@/components/ui/message-erreur";
import { CHEMIN_RAPPORT_PRESENCES, RAPPORT_LIGNES_MAX } from "@/lib/constantes";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { COLONNES_RAPPORT, preparerExportRapport } from "@/lib/export/rapport-presences";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { TEXTES_RAPPORT } from "@/lib/textes/rapport-presences";
import { chaineRapport, lireRechercheRapport } from "@/lib/validation/rapport-presences";

const textes = TEXTES_RAPPORT;

export const metadata: Metadata = { title: textes.document.titre, robots: { index: false } };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

/** Version imprimable du rapport : la fenêtre d'impression permet d'enregistrer en PDF. */
export default function PageImpressionRapport({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <div className="min-h-dvh bg-canevas px-4 py-6 print:bg-surface print:p-0">
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <DocumentRapport searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DocumentRapport({ searchParams }: { searchParams: ParametresRecherche }) {
  const recherche = lireRechercheRapport(await searchParams, aujourdhuiLocal());
  const donnees = await preparerExportRapport("pdf", recherche);
  if (!donnees) return <MessageErreur message={textes.droits} className="text-base" />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`${CHEMIN_RAPPORT_PRESENCES}${chaineRapport(recherche)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-base font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire">
          <ArrowLeft className="size-5" aria-hidden="true" />
          {textes.document.retour}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-texte-secondaire">{TEXTES_PERSONNES.export.aideImpression}</p>
          <BoutonImprimer />
        </div>
      </div>

      <article className="rounded-xl bg-surface p-8 shadow-carte ring-1 ring-bordure print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex items-start justify-between gap-6 border-b-2 border-primaire pb-5">
          <div className="flex items-center gap-3">
            <Image src="/logo-ps-time.webp" alt={TEXTES_CONNEXION.altLogo} width={1155} height={1163} sizes="48px" className="size-12" priority />
            <div>
              <p className="text-lg font-bold leading-tight text-marine">{TEXTES_NAVIGATION.nomApplication}</p>
              <p className="text-sm text-texte-secondaire">{TEXTES_NAVIGATION.sousTitreApplication}</p>
            </div>
          </div>
          <div className="text-end">
            <h1 className="text-2xl font-bold tracking-tight text-marine">{donnees.titre}</h1>
            <p className="mt-1 text-sm text-texte-secondaire">{donnees.sousTitre}</p>
          </div>
        </header>

        {donnees.estTronque && <MessageErreur message={textes.tableau.tropDeLignes(RAPPORT_LIGNES_MAX)} className="mt-4" />}

        {donnees.lignes.length === 0 ? (
          <p className="mt-6 text-base text-texte-secondaire">{textes.tableau.vide}</p>
        ) : (
          <table className="mt-6 w-full border-collapse text-left text-sm">
            <thead className="[print-color-adjust:exact]">
              <tr className="bg-primaire text-white">
                {COLONNES_RAPPORT.map(({ titre }) => (
                  <th key={titre} scope="col" className="px-3 py-2.5 font-semibold first:rounded-s-md last:rounded-e-md print:first:rounded-none print:last:rounded-none">{titre}</th>
                ))}
              </tr>
            </thead>
            <tbody className="[print-color-adjust:exact]">
              {donnees.lignes.map((ligne, index) => (
                <tr key={index} className="border-b border-bordure break-inside-avoid even:bg-fond">
                  {ligne.map((valeur, colonne) => (
                    <td key={colonne} className={colonne === 0 ? "px-3 py-2 font-mono font-semibold text-marine" : "px-3 py-2 text-texte tabular-nums"}>{valeur}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="mt-6 flex items-center gap-2 border-t border-bordure pt-4 text-sm text-texte-secondaire">
          <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
          {textes.document.confidentiel}
        </footer>
      </article>
    </div>
  );
}
