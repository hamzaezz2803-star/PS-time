import type { Metadata } from "next";
import { Suspense } from "react";
import { Briefcase, Building2, Users } from "lucide-react";
import { BanniereAccueil } from "@/components/espace/banniere-accueil";
import { CarteCompteur, CarteCompteurSquelette } from "@/components/espace/carte-compteur";
import { EtapesPlanning } from "@/components/espace/etapes-planning";
import { StatistiquesApercu } from "@/components/espace/statistiques-apercu";
import { CHEMIN_DEPARTEMENTS, CHEMIN_PERSONNES, CHEMIN_POSTES} from "@/lib/constantes";
import { compterDepartements } from "@/lib/donnees/departements";
import { compterEmployes } from "@/lib/donnees/employes";
import { compterPostes } from "@/lib/donnees/postes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { aAccesAuModule, peutAcceder } from "@/lib/metier/droits";
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
  // Chaque bloc n'apparaît que si le compte a la page (ou au moins une page du module) correspondante.
  const cartes = [
    { page: "personnes", href: CHEMIN_PERSONNES, libelle: TEXTES_NAVIGATION.personnes, Icone: Users, compter: compterEmployes },
    { page: "departements", href: CHEMIN_DEPARTEMENTS, libelle: TEXTES_NAVIGATION.departements, Icone: Building2, compter: compterDepartements },
    { page: "postes", href: CHEMIN_POSTES, libelle: TEXTES_NAVIGATION.postes, Icone: Briefcase, compter: compterPostes },
  ] as const;
  const visibles = cartes.filter((carte) => peutAcceder(utilisateur, carte.page));
  const totaux = await Promise.all(visibles.map((carte) => carte.compter()));

  return (
    <>
      <BanniereAccueil nom={utilisateur.nom} />

      {utilisateur.modules.length === 0 && (
        <p className="rounded-xl border border-bordure bg-surface p-5 text-base text-texte shadow-carte">{TEXTES_ESPACE.aucunModule}</p>
      )}

      {/* Présence : statistiques (aperçu de démonstration). */}
      {aAccesAuModule(utilisateur, "presence") && <StatistiquesApercu />}

      {visibles.length > 0 && (
        <section aria-labelledby="titre-chiffres" className="flex flex-col gap-4">
          <h2 id="titre-chiffres" className="text-lg font-semibold text-marine">{TEXTES_ESPACE.titreChiffres}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((carte, rang) => (
              <CarteCompteur key={carte.page} href={carte.href} libelle={carte.libelle} total={totaux[rang] ?? 0} Icone={carte.Icone} />
            ))}
          </div>
        </section>
      )}

      <EtapesPlanning droits={utilisateur} />
    </>
  );
}
