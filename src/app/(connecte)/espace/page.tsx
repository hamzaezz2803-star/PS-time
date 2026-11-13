import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2, ChevronRight } from "lucide-react";
import { Chargement } from "@/components/ui/chargement";
import { CHEMIN_DEPARTEMENTS } from "@/lib/constantes";
import { compterDepartements } from "@/lib/donnees/departements";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_ESPACE } from "@/lib/textes/espace";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";

export const metadata: Metadata = { title: TEXTES_NAVIGATION.tableauDeBord };

export default function PageTableauDeBord() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Suspense fallback={<Chargement message={TEXTES_ESPACE.chargement} />}>
        <ContenuTableauDeBord />
      </Suspense>
    </div>
  );
}

async function ContenuTableauDeBord() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  const nombreDepartements = await compterDepartements();

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marine sm:text-[1.75rem]">
          {TEXTES_ESPACE.bonjour(utilisateur.nom)}
        </h1>
        <p className="mt-1.5 max-w-2xl text-base text-texte-secondaire">{TEXTES_ESPACE.introduction}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={CHEMIN_DEPARTEMENTS}
          className="group flex items-center gap-4 rounded-xl border border-bordure bg-surface p-5 transition-colors duration-150 hover:border-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-ciel text-primaire">
            <Building2 className="size-6" aria-hidden="true" />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="text-sm text-texte-secondaire">{TEXTES_NAVIGATION.departements}</span>
            <span className="text-2xl font-bold text-marine">{nombreDepartements}</span>
          </span>
          <ChevronRight className="size-5 text-texte-secondaire group-hover:text-primaire" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
