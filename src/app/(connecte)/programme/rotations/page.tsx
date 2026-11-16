import type { Metadata } from "next";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { GestionRotations } from "@/components/programme/gestion-rotations";
import { listerProfils } from "@/lib/donnees/profils-horaires";
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
  const [rotations, profils] = await Promise.all([listerRotations(), listerProfils()]);
  return <GestionRotations rotations={rotations} profils={profils} />;
}
