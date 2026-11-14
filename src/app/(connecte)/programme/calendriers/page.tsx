import type { Metadata } from "next";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { GestionCalendriers } from "@/components/programme/gestion-calendriers";
import { listerCalendriers } from "@/lib/donnees/calendriers";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";

const textes = TEXTES_PROGRAMME.calendriers;

export const metadata: Metadata = { title: textes.titrePage };

export default function PageCalendriers() {
  return (
    <CadrePageProgramme titre={textes.titrePage} sousTitre={textes.sousTitre} chargement={textes.chargement}>
      <ContenuCalendriers />
    </CadrePageProgramme>
  );
}

async function ContenuCalendriers() {
  const refus = await refusSiNonAutorise();
  if (refus) return refus;
  return <GestionCalendriers calendriers={await listerCalendriers()} />;
}
