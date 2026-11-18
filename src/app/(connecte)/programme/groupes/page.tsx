import type { Metadata } from "next";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { GestionGroupes } from "@/components/programme/gestion-groupes";
import { listerEmployesSelection, listerGroupes } from "@/lib/donnees/groupes";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";

const textes = TEXTES_PROGRAMME.groupes;

export const metadata: Metadata = { title: textes.titrePage };

export default function PageGroupes() {
  return (
    <CadrePageProgramme titre={textes.titrePage} sousTitre={textes.sousTitre} chargement={textes.chargement}>
      <ContenuGroupes />
    </CadrePageProgramme>
  );
}

async function ContenuGroupes() {
  const refus = await refusSiNonAutorise("groupes");
  if (refus) return refus;
  const [groupes, employes] = await Promise.all([listerGroupes(), listerEmployesSelection()]);
  return <GestionGroupes groupes={groupes} employes={employes} />;
}
