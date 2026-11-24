import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FiltresEtat } from "@/components/etats/filtres-etat";
import { TableauEtat } from "@/components/etats/tableau-etat";
import { CadrePageProgramme } from "@/components/programme/cadre-page-programme";
import { MessageErreur } from "@/components/ui/message-erreur";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { listerDepartements } from "@/lib/donnees/departements";
import { chargerEtat, type TableauEtat as Tableau } from "@/lib/donnees/etats";
import { COLONNES_ETATS, maintenantLocal, peutVoirEtat } from "@/lib/export/etats";
import { ETATS, estEtat, type Etat } from "@/lib/metier/etats";
import { TEXTES_ETATS as textes } from "@/lib/textes/etats";
import { lireRechercheEtat } from "@/lib/validation/etats";

/** Les quatre états sont connus : leurs pages sont préparées au build (Cache Components). */
export const generateStaticParams = () => ETATS.map((etat) => ({ etat }));

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Promise<{ etat: string }> }): Promise<Metadata> {
  const { etat } = await params;
  return { title: estEtat(etat) ? textes.etats[etat].titre : undefined };
}

/** Un état du menu État : filtres, tableau et exports (une seule page pour tous les états). */
export default async function PageEtat({ params, searchParams }: { params: Promise<{ etat: string }>; searchParams: ParametresRecherche }) {
  const { etat } = await params;
  if (!estEtat(etat)) notFound();
  return (
    <CadrePageProgramme titre={textes.etats[etat].titre} sousTitre={textes.etats[etat].sousTitre} chargement={textes.chargement}>
      <ContenuEtat etat={etat} searchParams={searchParams} />
    </CadrePageProgramme>
  );
}

async function ContenuEtat({ etat, searchParams }: { etat: Etat; searchParams: ParametresRecherche }) {
  if (!(await peutVoirEtat(etat))) return <MessageErreur message={textes.droits} className="text-base" />;

  const aujourdhui = aujourdhuiLocal();
  const recherche = lireRechercheEtat(await searchParams, aujourdhui);
  let tableau: Tableau;
  try {
    tableau = await chargerEtat(etat, recherche, maintenantLocal());
  } catch (erreur) {
    console.error("Échec du chargement d'un état", { etat, type: erreur instanceof Error ? erreur.name : "inconnu" });
    return <MessageErreur message={textes.echec} className="text-base" />;
  }
  const departements = await listerDepartements();

  return (
    <>
      <FiltresEtat etat={etat} recherche={recherche} departements={departements} aujourdhui={aujourdhui} />
      <TableauEtat titre={textes.etats[etat].titre} vide={textes.etats[etat].vide} colonnes={COLONNES_ETATS[etat]} lignes={tableau.lignes} estTronque={tableau.estTronque} />
    </>
  );
}
