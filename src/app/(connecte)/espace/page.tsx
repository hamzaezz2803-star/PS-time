import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Briefcase, Building2, Users } from "lucide-react";
import { BanniereAccueil } from "@/components/espace/banniere-accueil";
import { CarteCompteur, CarteCompteurSquelette } from "@/components/espace/carte-compteur";
import { EtapesPlanning } from "@/components/espace/etapes-planning";
import { StatistiquesPresence } from "@/components/espace/statistiques/statistiques-presence";
import { MessageErreur } from "@/components/ui/message-erreur";
import { CHEMIN_DEPARTEMENTS, CHEMIN_PERSONNES, CHEMIN_POSTES, STATISTIQUES_PERIODES, STATISTIQUES_PERIODE_DEFAUT } from "@/lib/constantes";
import { compterDepartements } from "@/lib/donnees/departements";
import { compterEmployes } from "@/lib/donnees/employes";
import { compterPostes } from "@/lib/donnees/postes";
import { chargerStatistiques, type DonneesStatistiques } from "@/lib/donnees/statistiques-presence";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { aAccesAuModule, peutAcceder } from "@/lib/metier/droits";
import { TEXTES_ESPACE } from "@/lib/textes/espace";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";

export const metadata: Metadata = { title: TEXTES_NAVIGATION.tableauDeBord };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

export default function PageTableauDeBord({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <Suspense fallback={<SqueletteTableauDeBord />}>
        <ContenuTableauDeBord searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/** Période choisie dans l'URL (?periode=7|14|30), sinon la période par défaut. */
function lirePeriode(valeur: string | string[] | undefined): number {
  const periode = Number(Array.isArray(valeur) ? valeur[0] : valeur);
  return (STATISTIQUES_PERIODES as readonly number[]).includes(periode) ? periode : STATISTIQUES_PERIODE_DEFAUT;
}

function SqueletteStatistiques() {
  return (
    <div role="status" className="flex flex-col gap-5">
      <span className="sr-only">{TEXTES_PRESENCE.statistiques.chargement}</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((rang) => (
          <span key={rang} className="h-32 animate-pulse rounded-xl bg-canevas motion-reduce:animate-none" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3" aria-hidden="true">
        <span className="h-80 animate-pulse rounded-xl bg-canevas motion-reduce:animate-none lg:col-span-2" />
        <span className="h-80 animate-pulse rounded-xl bg-canevas motion-reduce:animate-none" />
      </div>
    </div>
  );
}

/** Statistiques de présence (calcul sur toute l'équipe), chargées à part pour ne pas retarder le reste. */
async function StatistiquesDuTableau({ searchParams }: { searchParams: ParametresRecherche }) {
  // Calcul à l'heure de la requête (jamais figé au prérendu) : il dépend de l'instant présent.
  await connection();
  const periode = lirePeriode((await searchParams).periode);
  let donnees: DonneesStatistiques;
  try {
    donnees = await chargerStatistiques(periode, new Date());
  } catch (erreur) {
    console.error("Échec du calcul des statistiques de présence", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return <MessageErreur message={TEXTES_PRESENCE.statistiques.echec} className="text-base" />;
  }
  return <StatistiquesPresence donnees={donnees} periode={periode} />;
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

async function ContenuTableauDeBord({ searchParams }: { searchParams: ParametresRecherche }) {
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

      {/* Présence : statistiques réelles, pour tout compte qui a au moins une page du module. */}
      {aAccesAuModule(utilisateur, "presence") && (
        <Suspense fallback={<SqueletteStatistiques />}>
          <StatistiquesDuTableau searchParams={searchParams} />
        </Suspense>
      )}

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
