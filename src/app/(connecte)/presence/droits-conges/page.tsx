import type { Metadata } from "next";
import { GestionDroits } from "@/components/droits-conges/gestion-droits";
import { ListeDroits } from "@/components/droits-conges/liste-droits";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { DROITS_CONGES_PAR_PAGE } from "@/lib/constantes";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { listerDepartements } from "@/lib/donnees/departements";
import { compterDroits, listerDroits, listerEvenementsDroits } from "@/lib/donnees/droits-conges";
import { listerEmployesSelection, listerGroupes } from "@/lib/donnees/groupes";
import { lirePage } from "@/lib/metier/pagination";
import { TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import { lireRechercheAbsences } from "@/lib/validation/absence";

export const metadata: Metadata = { title: textes.titrePage };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PageDroitsConges({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <CadrePageProgramme titre={textes.titrePage} chargement={textes.chargement}>
      <ContenuDroits searchParams={searchParams} />
    </CadrePageProgramme>
  );
}

async function ContenuDroits({ searchParams }: { searchParams: ParametresRecherche }) {
  // Noms d'employés et soldes de congés : page accordée seulement (moindre privilège).
  const refus = await refusSiNonAutorise("droits_conges");
  if (refus) return refus;

  const parametres = await searchParams;
  // Mêmes filtres que les absences : employé, et « valable le » (jour compris dans la période).
  const recherche = lireRechercheAbsences(parametres);
  const [total, employes, groupes, departements, evenements] = await Promise.all([
    compterDroits(recherche),
    listerEmployesSelection(),
    listerGroupes(),
    listerDepartements(),
    listerEvenementsDroits(),
  ]);
  const nombrePages = Math.max(1, Math.ceil(total / DROITS_CONGES_PAR_PAGE));
  const page = lirePage(parametres.page, nombrePages);
  const droits = await listerDroits(page, DROITS_CONGES_PAR_PAGE, recherche, aujourdhuiLocal());

  return (
    <GestionDroits droits={droits} employes={employes} groupes={groupes.map(({ id, nom }) => ({ id, nom }))} departements={departements} evenements={evenements}>
      <ListeDroits droits={droits} total={total} page={page} nombrePages={nombrePages} recherche={recherche} />
    </GestionDroits>
  );
}
