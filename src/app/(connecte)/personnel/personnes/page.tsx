import type { Metadata } from "next";
import { Suspense } from "react";
import { CreationEmploye } from "@/components/personnes/creation-employe";
import { ListeEmployes } from "@/components/personnes/liste-employes";
import { Chargement } from "@/components/ui/chargement";
import { MessageErreur } from "@/components/ui/message-erreur";
import { EMPLOYES_PAR_PAGE } from "@/lib/constantes";
import { listerChampsPersonnalises } from "@/lib/donnees/champs-personnalises";
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

export const metadata: Metadata = { title: TEXTES_PERSONNES.titrePage };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PagePersonnes({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marine sm:text-[1.75rem]">
          {TEXTES_PERSONNES.titrePage}
        </h1>
        <p className="mt-1.5 max-w-2xl text-base text-texte-secondaire">
          {TEXTES_PERSONNES.sousTitre}
        </p>
      </div>
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

  const [departements, postes, champs, total] = await Promise.all([
    listerDepartements(),
    listerPostes(),
    listerChampsPersonnalises(),
    compterEmployes(),
  ]);
  const nombrePages = Math.max(1, Math.ceil(total / EMPLOYES_PAR_PAGE));
  const page = lirePage((await searchParams).page, nombrePages);
  const employes = await listerEmployes(page, EMPLOYES_PAR_PAGE);

  return (
    <>
      <CreationEmploye
        departements={versOptions(construireArbre(departements))}
        postes={versOptions(construireArbre(postes, comparerPostes))}
        champs={champs}
      />
      <ListeEmployes employes={employes} total={total} page={page} nombrePages={nombrePages} />
    </>
  );
}
