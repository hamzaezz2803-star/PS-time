import type { Metadata } from "next";
import { GestionAbsences } from "@/components/absences/gestion-absences";
import { ListeAbsences } from "@/components/absences/liste-absences";
import { CadrePageProgramme, refusSiNonAutorise } from "@/components/programme/cadre-page-programme";
import { ABSENCES_PAR_PAGE } from "@/lib/constantes";
import { compterAbsences, listerAbsences, listerEvenementsSaisissables } from "@/lib/donnees/absences";
import { listerDepartements } from "@/lib/donnees/departements";
import { listerEmployesSelection } from "@/lib/donnees/groupes";
import { lirePage } from "@/lib/metier/pagination";
import { TEXTES_ABSENCES as textes } from "@/lib/textes/absences";
import { lireRechercheAbsences } from "@/lib/validation/absence";

export const metadata: Metadata = { title: textes.titrePage };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PageAbsences({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <CadrePageProgramme titre={textes.titrePage} chargement={textes.chargement}>
      <ContenuAbsences searchParams={searchParams} />
    </CadrePageProgramme>
  );
}

async function ContenuAbsences({ searchParams }: { searchParams: ParametresRecherche }) {
  // Noms d'employés et motifs d'absence : page accordée seulement (moindre privilège).
  const refus = await refusSiNonAutorise("absences");
  if (refus) return refus;

  const parametres = await searchParams;
  const recherche = lireRechercheAbsences(parametres);
  const [total, employes, departements, evenements] = await Promise.all([
    compterAbsences(recherche),
    listerEmployesSelection(),
    listerDepartements(),
    listerEvenementsSaisissables(),
  ]);
  const nombrePages = Math.max(1, Math.ceil(total / ABSENCES_PAR_PAGE));
  const page = lirePage(parametres.page, nombrePages);
  const absences = await listerAbsences(page, ABSENCES_PAR_PAGE, recherche);

  return (
    <GestionAbsences employes={employes} departements={departements} evenements={evenements}>
      <ListeAbsences absences={absences} total={total} page={page} nombrePages={nombrePages} recherche={recherche} />
    </GestionAbsences>
  );
}
