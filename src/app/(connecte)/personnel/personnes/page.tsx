import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionEmployes } from "@/components/personnes/gestion-employes";
import { ListeEmployes } from "@/components/personnes/liste-employes";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { EMPLOYES_PAR_PAGE } from "@/lib/constantes";
import { listerDepartements } from "@/lib/donnees/departements";
import { compterEmployes, listerEmployes } from "@/lib/donnees/employes";
import { listerPostes } from "@/lib/donnees/postes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import {
  aplatirArbre,
  construireArbre,
  type ElementArbre,
  type Noeud,
} from "@/lib/metier/arbre";
import { comparerPostes } from "@/lib/metier/postes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { lireRechercheEmployes } from "@/lib/validation/recherche-employes";

export const metadata: Metadata = { title: TEXTES_PERSONNES.titrePage };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PagePersonnes({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={TEXTES_PERSONNES.titrePage} sousTitre={TEXTES_PERSONNES.sousTitre} />
      <Suspense fallback={<Chargement message={TEXTES_PERSONNES.chargement} />}>
        <ContenuPersonnes searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/** Options indentées selon la profondeur dans l'arbre (départements, postes). */
function versOptions<T extends ElementArbre>(arbre: Noeud<T>[]) {
  return aplatirArbre(arbre).map((element) => ({
    valeur: element.id,
    libelle: "\u00a0".repeat(element.profondeur * 4) + element.nom,
  }));
}

/** Numéro de page demandé, ramené entre 1 et le nombre de pages. */
function lirePage(valeur: string | string[] | undefined, nombrePages: number): number {
  const page = Number.parseInt(typeof valeur === "string" ? valeur : "1", 10);
  return Number.isNaN(page) ? 1 : Math.min(Math.max(page, 1), nombrePages);
}

async function ContenuPersonnes({ searchParams }: { searchParams: ParametresRecherche }) {
  const utilisateur = await obtenirUtilisateurPourEspace();
  // Données personnelles : réservées aux super administrateurs (moindre privilège).
  if (!utilisateur.estSuperAdmin) {
    return <MessageErreur message={TEXTES_PERSONNES.droits} className="text-base" />;
  }

  const parametres = await searchParams;
  const recherche = lireRechercheEmployes(parametres);
  const [departements, postes, total] = await Promise.all([
    listerDepartements(),
    listerPostes(),
    compterEmployes(recherche),
  ]);
  const nombrePages = Math.max(1, Math.ceil(total / EMPLOYES_PAR_PAGE));
  const page = lirePage(parametres.page, nombrePages);
  const employes = await listerEmployes(page, EMPLOYES_PAR_PAGE, recherche);
  const optionsDepartements = versOptions(construireArbre(departements));

  return (
    <>
      <GestionEmployes
        departements={optionsDepartements}
        postes={versOptions(construireArbre(postes, comparerPostes))}
      >
        <ListeEmployes employes={employes} total={total} page={page} nombrePages={nombrePages} recherche={recherche} departements={optionsDepartements} />
      </GestionEmployes>
    </>
  );
}
