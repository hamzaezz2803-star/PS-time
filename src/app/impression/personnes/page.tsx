import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { BoutonImprimer } from "@/components/personnes/bouton-imprimer";
import { Chargement } from "@/components/ui/chargement";
import { MessageErreur } from "@/components/ui/message-erreur";
import { CHEMIN_PERSONNES, EXPORT_EMPLOYES_MAX } from "@/lib/constantes";
import { preparerExportEmployes } from "@/lib/export/preparer-export-employes";
import { COLONNES_EXPORT_EMPLOYES, type LigneExportEmploye } from "@/lib/metier/export-employes";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { lireRechercheEmployes } from "@/lib/validation/recherche-employes";

const { export: textes, liste } = TEXTES_PERSONNES;

export const metadata: Metadata = { title: textes.titreDocument, robots: { index: false } };

const TITRES: Record<keyof LigneExportEmploye, string> = {
  matricule: liste.matricule,
  numeroBadge: liste.numeroBadge,
  nom: liste.nomComplet,
  prenom: textes.prenom,
  departement: liste.departement,
  poste: liste.poste,
  telephone: liste.telephone,
  dateEmbauche: liste.dateEmbauche,
};

/** Version imprimable de la liste des employés : la fenêtre d'impression permet d'enregistrer en PDF. */
type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PageImpressionPersonnes({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <div className="min-h-dvh bg-canevas px-4 py-6 print:bg-surface print:p-0">
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <DocumentEmployes searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DocumentEmployes({ searchParams }: { searchParams: ParametresRecherche }) {
  const donnees = await preparerExportEmployes("pdf", lireRechercheEmployes(await searchParams));
  if (!donnees) return <MessageErreur message={TEXTES_PERSONNES.droits} className="text-base" />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={CHEMIN_PERSONNES} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-base font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire">
          <ArrowLeft className="size-5" aria-hidden="true" />
          {textes.retour}
        </Link>
        <BoutonImprimer />
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
            <h1 className="text-2xl font-bold tracking-tight text-marine">{textes.titreDocument}</h1>
            <p className="mt-1 text-sm text-texte-secondaire">{donnees.sousTitre}</p>
          </div>
        </header>

        {donnees.estTronque && (
          <MessageErreur message={textes.tropDeLignes(EXPORT_EMPLOYES_MAX)} className="mt-4" />
        )}

        <table className="mt-6 w-full border-collapse text-left text-sm">
          <thead className="[print-color-adjust:exact]">
            <tr className="bg-primaire text-white">
              {COLONNES_EXPORT_EMPLOYES.map(({ cle }) => (
                <th key={cle} scope="col" className="px-3 py-2.5 font-semibold first:rounded-s-md last:rounded-e-md print:first:rounded-none print:last:rounded-none">
                  {TITRES[cle]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[print-color-adjust:exact]">
            {donnees.lignes.map((ligne, index) => (
              <tr key={`${ligne.matricule}-${index}`} className="border-b border-bordure break-inside-avoid even:bg-fond">
                {COLONNES_EXPORT_EMPLOYES.map(({ cle }) => (
                  <td key={cle} className={cle === "matricule" ? "px-3 py-2 font-mono font-semibold text-marine" : "px-3 py-2 text-texte"}>
                    {ligne[cle] || <span className="text-texte-secondaire">–</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-6 flex items-center gap-2 border-t border-bordure pt-4 text-sm text-texte-secondaire">
          <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
          {textes.confidentiel}
        </footer>
      </article>
    </div>
  );
}
