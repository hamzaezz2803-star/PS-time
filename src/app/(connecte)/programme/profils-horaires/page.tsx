import type { Metadata } from "next";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { GestionProfils } from "@/components/profils-horaires/gestion-profils";
import { listerProfils } from "@/lib/donnees/profils-horaires";
import { TEXTES_PROFILS } from "@/lib/textes/profils-horaires";

export const metadata: Metadata = { title: TEXTES_PROFILS.titrePage };

export default function PageProfilsHoraires() {
  return (
    <CadrePageProgramme titre={TEXTES_PROFILS.titrePage} sousTitre={TEXTES_PROFILS.sousTitre} chargement={TEXTES_PROFILS.chargement}>
      <ContenuProfils />
    </CadrePageProgramme>
  );
}

async function ContenuProfils() {
  const refus = await refusSiNonAutorise("profils_horaires");
  if (refus) return refus;
  return <GestionProfils profils={await listerProfils()} />;
}
