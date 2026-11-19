import type { Metadata } from "next";
import { GestionEvenements } from "@/components/evenements/gestion-evenements";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { FUSEAU_HORAIRE } from "@/lib/constantes";
import { listerEvenements } from "@/lib/donnees/evenements";
import { jourDansFuseau } from "@/lib/metier/dates";
import { TEXTES_EVENEMENTS } from "@/lib/textes/evenements";

export const metadata: Metadata = { title: TEXTES_EVENEMENTS.titrePage };

export default function PageEvenements() {
  return (
    <CadrePageProgramme titre={TEXTES_EVENEMENTS.titrePage} sousTitre={TEXTES_EVENEMENTS.sousTitre} chargement={TEXTES_EVENEMENTS.chargement}>
      <ContenuEvenements />
    </CadrePageProgramme>
  );
}

async function ContenuEvenements() {
  const refus = await refusSiNonAutorise("evenements");
  if (refus) return refus;
  // Jour de Casablanca calculé par le serveur : la liste dit si chaque événement peut être pris aujourd'hui.
  return <GestionEvenements evenements={await listerEvenements()} aujourdhui={jourDansFuseau(new Date(), FUSEAU_HORAIRE)} />;
}
