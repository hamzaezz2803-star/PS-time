import type { Metadata } from "next";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { GestionRotations } from "@/components/programme/gestion-rotations";
import { listerCalendriers } from "@/lib/donnees/calendriers";
import { listerRotations } from "@/lib/donnees/rotations";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";

const textes = TEXTES_PROGRAMME.rotations;

export const metadata: Metadata = { title: textes.titrePage };

export default function PageRotations() {
  return (
    <CadrePageProgramme titre={textes.titrePage} sousTitre={textes.sousTitre} chargement={textes.chargement}>
      <ContenuRotations />
    </CadrePageProgramme>
  );
}

async function ContenuRotations() {
  const refus = await refusSiNonAutorise();
  if (refus) return refus;
  const [rotations, calendriers] = await Promise.all([listerRotations(), listerCalendriers()]);
  return <GestionRotations rotations={rotations} calendriers={calendriers} />;
}
