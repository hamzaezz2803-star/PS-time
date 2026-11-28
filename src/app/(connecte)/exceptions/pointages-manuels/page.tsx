import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionPointages } from "@/components/exceptions/gestion-pointages";
import { ListePointages } from "@/components/exceptions/liste-pointages";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { POINTAGES_PAR_PAGE } from "@/lib/constantes";
import { listerDepartements } from "@/lib/donnees/departements";
import { listerEmployesSelection } from "@/lib/donnees/groupes";
import { evaluerPointages } from "@/lib/donnees/planning";
import { compterPointagesManuels, listerPointagesManuels } from "@/lib/donnees/pointages";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { lirePage } from "@/lib/metier/pagination";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import { lireRecherchePointages } from "@/lib/validation/pointage";

const textes = TEXTES_EXCEPTIONS.pointages;

export const metadata: Metadata = { title: textes.titrePage };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PagePointagesManuels({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} />
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <ContenuPointages searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ContenuPointages({ searchParams }: { searchParams: ParametresRecherche }) {
  const utilisateur = await obtenirUtilisateurPourEspace();
  // Pointages et noms d'employés : réservés aux super administrateurs (moindre privilège).
  if (!peutAcceder(utilisateur, "pointages_manuels")) return <MessageErreur message={textes.droits} className="text-base" />;

  const parametres = await searchParams;
  const recherche = lireRecherchePointages(parametres);
  const [total, employes, departements] = await Promise.all([
    compterPointagesManuels(recherche),
    listerEmployesSelection(),
    listerDepartements(),
  ]);
  const nombrePages = Math.max(1, Math.ceil(total / POINTAGES_PAR_PAGE));
  const page = lirePage(parametres.page, nombrePages);
  const pointages = await listerPointagesManuels(page, POINTAGES_PAR_PAGE, recherche);
  const statuts = await evaluerPointages(pointages);

  return (
    <GestionPointages employes={employes} departements={departements}>
      <ListePointages pointages={pointages} statuts={statuts} total={total} page={page} nombrePages={nombrePages} recherche={recherche} />
    </GestionPointages>
  );
}
