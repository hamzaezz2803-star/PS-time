import type { Metadata } from "next";
import { Suspense } from "react";
import { Briefcase, Building2, Users } from "lucide-react";
import { BanniereAccueil } from "@/components/espace/banniere-accueil";
import { CarteCompteur, CarteCompteurSquelette } from "@/components/espace/carte-compteur";
import { EtapesPlanning } from "@/components/espace/etapes-planning";
import { CHEMIN_DEPARTEMENTS, CHEMIN_PERSONNES, CHEMIN_POSTES } from "@/lib/constantes";
import { compterDepartements } from "@/lib/donnees/departements";
import { compterEmployes } from "@/lib/donnees/employes";
import { compterPostes } from "@/lib/donnees/postes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_ESPACE } from "@/lib/textes/espace";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";

export const metadata: Metadata = { title: TEXTES_NAVIGATION.tableauDeBord };

export default function PageTableauDeBord() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <Suspense fallback={<SqueletteTableauDeBord />}>
        <ContenuTableauDeBord />
      </Suspense>
    </div>
  );
}

function SqueletteTableauDeBord() {
  return (
    <div role="status" className="flex flex-col gap-8">
      <span className="sr-only">{TEXTES_ESPACE.chargement}</span>
      <div className="h-40 animate-pulse rounded-xl bg-canevas motion-reduce:animate-none" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CarteCompteurSquelette />
        <CarteCompteurSquelette />
        <CarteCompteurSquelette />
      </div>
    </div>
  );
}

async function ContenuTableauDeBord() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  // Personnes et Planning sont réservés aux super administrateurs : leurs blocs aussi.
  const [nombreDepartements, nombrePostes, nombreEmployes] = await Promise.all([
    compterDepartements(),
    compterPostes(),
    utilisateur.estSuperAdmin ? compterEmployes() : null,
  ]);

  return (
    <>
      <BanniereAccueil nom={utilisateur.nom} />

      <section aria-labelledby="titre-chiffres" className="flex flex-col gap-4">
        <h2 id="titre-chiffres" className="text-lg font-semibold text-marine">{TEXTES_ESPACE.titreChiffres}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nombreEmployes !== null && (
            <CarteCompteur href={CHEMIN_PERSONNES} libelle={TEXTES_NAVIGATION.personnes} total={nombreEmployes} Icone={Users} />
          )}
          <CarteCompteur href={CHEMIN_DEPARTEMENTS} libelle={TEXTES_NAVIGATION.departements} total={nombreDepartements} Icone={Building2} />
          <CarteCompteur href={CHEMIN_POSTES} libelle={TEXTES_NAVIGATION.postes} total={nombrePostes} Icone={Briefcase} />
        </div>
      </section>

      {utilisateur.estSuperAdmin && <EtapesPlanning />}
    </>
  );
}
