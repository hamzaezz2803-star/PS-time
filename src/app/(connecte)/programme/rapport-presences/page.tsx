import type { Metadata } from "next";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { FiltresRapport } from "@/components/rapport-presences/filtres-rapport";
import { TableauRapport } from "@/components/rapport-presences/tableau-rapport";
import { MessageErreur } from "@/components/ui/message-erreur";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { listerDepartements } from "@/lib/donnees/departements";
import { chargerRapport, type Rapport } from "@/lib/donnees/rapport-presences";
import { TEXTES_RAPPORT as textes } from "@/lib/textes/rapport-presences";
import { lireRechercheRapport } from "@/lib/validation/rapport-presences";

export const metadata: Metadata = { title: textes.titrePage };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PageRapportPresences({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <CadrePageProgramme titre={textes.titrePage} sousTitre={textes.sousTitre} chargement={textes.chargement}>
      <ContenuRapport searchParams={searchParams} />
    </CadrePageProgramme>
  );
}

async function ContenuRapport({ searchParams }: { searchParams: ParametresRecherche }) {
  const refus = await refusSiNonAutorise("rapport_presences");
  if (refus) return refus;

  const aujourdhui = aujourdhuiLocal();
  const recherche = lireRechercheRapport(await searchParams, aujourdhui);
  let rapport: Rapport;
  try {
    rapport = await chargerRapport(recherche);
  } catch (erreur) {
    console.error("Échec du chargement du rapport des présences", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return <MessageErreur message={textes.echec} className="text-base" />;
  }
  const departements = await listerDepartements();

  return (
    <>
      <FiltresRapport recherche={recherche} departements={departements} aujourdhui={aujourdhui} />
      {/* Clé = critères : un nouveau rapport repart d'un filtre vide. */}
      <TableauRapport key={`${recherche.du}|${recherche.au}|${recherche.departementId ?? ""}`} lignes={rapport.lignes} estTronque={rapport.estTronque} />
    </>
  );
}
