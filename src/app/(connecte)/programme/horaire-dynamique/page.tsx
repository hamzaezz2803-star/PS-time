import type { Metadata } from "next";
import { GestionHoraireDynamique } from "@/components/horaire-dynamique/gestion-horaire-dynamique";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { listerDepartements } from "@/lib/donnees/departements";
import { listerEmployesSelection } from "@/lib/donnees/groupes";
import { listerEmployesHoraireDynamique, listerRegles } from "@/lib/donnees/horaire-dynamique";
import { listerProfils } from "@/lib/donnees/profils-horaires";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";

export const metadata: Metadata = { title: textes.titrePage };

export default function PageHoraireDynamique() {
  return (
    <CadrePageProgramme titre={textes.titrePage} sousTitre={textes.sousTitre} chargement={textes.chargement}>
      <ContenuHoraireDynamique />
    </CadrePageProgramme>
  );
}

async function ContenuHoraireDynamique() {
  const refus = await refusSiNonAutorise("horaire_dynamique");
  if (refus) return refus;
  const [regles, profils, employes, departements, selection] = await Promise.all([
    listerRegles(),
    listerProfils(),
    listerEmployesSelection(),
    listerDepartements(),
    listerEmployesHoraireDynamique(),
  ]);
  // Seuls les profils de travail peuvent être reconnus (un repos ne se pointe pas).
  const optionsProfils = profils
    .filter((profil) => profil.type === "travail")
    .map((profil) => ({ valeur: profil.id, libelle: `${profil.code} · ${profil.nom}` }));
  return <GestionHoraireDynamique regles={regles} profils={optionsProfils} employes={employes} departements={departements} selection={selection} />;
}
