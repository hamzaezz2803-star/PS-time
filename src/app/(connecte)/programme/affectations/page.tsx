import type { Metadata } from "next";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { GestionAffectations } from "@/components/programme/gestion-affectations";
import { listerAffectations } from "@/lib/donnees/affectations";
import { listerEmployesSelection, listerGroupes } from "@/lib/donnees/groupes";
import { listerRotations } from "@/lib/donnees/rotations";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";

const textes = TEXTES_PROGRAMME.affectations;

export const metadata: Metadata = { title: textes.titrePage };

export default function PageAffectations() {
  return (
    <CadrePageProgramme titre={textes.titrePage} sousTitre={textes.sousTitre} chargement={textes.chargement}>
      <ContenuAffectations />
    </CadrePageProgramme>
  );
}

async function ContenuAffectations() {
  const refus = await refusSiNonAutorise("affectations");
  if (refus) return refus;
  const [affectations, rotations, groupes, employes] = await Promise.all([
    listerAffectations(),
    listerRotations(),
    listerGroupes(),
    listerEmployesSelection(),
  ]);
  const options = {
    rotations: rotations.map((rotation) => ({ valeur: rotation.id, libelle: rotation.nom })),
    groupes: groupes.map((groupe) => ({ valeur: groupe.id, libelle: groupe.nom })),
    employes: employes.map((employe) => ({ valeur: employe.id, libelle: `${employe.nomComplet} (${employe.matricule})` })),
  };
  return <GestionAffectations affectations={affectations} options={options} />;
}
