import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserRoundSearch } from "lucide-react";
import { BarrePlanning } from "@/components/planning/barre-planning";
import { CalendrierMensuel } from "@/components/planning/calendrier-mensuel";
import { LegendePlanning } from "@/components/planning/legende-planning";
import { NavigationPlanning, ZonePlanning } from "@/components/planning/navigation-planning";
import { PlanningAnnuel } from "@/components/planning/planning-annuel";
import { ResumePlanning } from "@/components/planning/resume-planning";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { VUES_PLANNING } from "@/lib/constantes";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { listerDepartements } from "@/lib/donnees/departements";
import { listerEmployesSelection } from "@/lib/donnees/groupes";
import { chargerPlanningEmploye } from "@/lib/donnees/planning-consultation";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { bornesDuMois, totaliser } from "@/lib/metier/planning-consultation";
import { TEXTES_PLANNING as textes } from "@/lib/textes/planning";
import { lireSelectionPlanning, lireVuePlanning, type SelectionPlanning, type VuePlanning } from "@/lib/validation/planning-consultation";

export const metadata: Metadata = { title: textes.titrePage };

// Les deux affichages sont connus : leurs adresses sont préparées à la construction.
export const generateStaticParams = () => VUES_PLANNING.map((vue) => ({ vue }));

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

/** Consultation > Planning > Mensuel ou Annuel (même écran, affichage choisi par l'adresse). */
export default function PagePlanning({ params, searchParams }: PageProps<"/consultation/planning/[vue]">) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} />
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <ContenuPlanning params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ContenuPlanning({ params, searchParams }: { params: Promise<{ vue: string }>; searchParams: ParametresRecherche }) {
  const vue: VuePlanning | null = lireVuePlanning((await params).vue);
  if (!vue) notFound();
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "planning")) return <MessageErreur message={textes.droits} className="text-base" />;

  const aujourdhui = aujourdhuiLocal();
  const selection = lireSelectionPlanning(vue, await searchParams, aujourdhui);
  const [employes, departements] = await Promise.all([listerEmployesSelection(), listerDepartements()]);

  return (
    <NavigationPlanning selection={selection}>
      <BarrePlanning employes={employes} departements={departements} aujourdhui={aujourdhui} />
      <ZonePlanning>
        {selection.employe ? (
          <Planning selection={{ ...selection, employe: selection.employe }} aujourdhui={aujourdhui} peutOuvrir={peutAcceder(utilisateur, "detail_jour")} />
        ) : (
          <AucunEmploye />
        )}
      </ZonePlanning>
    </NavigationPlanning>
  );
}

function AucunEmploye() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-bordure-champ bg-surface px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire ring-8 ring-ciel/40">
        <UserRoundSearch className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-1 text-base font-semibold text-texte">{textes.vide.titre}</p>
      <p className="max-w-sm text-sm text-texte-secondaire">{textes.vide.detail}</p>
    </div>
  );
}

/** `peutOuvrir` : le compte a la page Détail jour, ouverte d'un clic sur un jour. */
async function Planning({ selection, aujourdhui, peutOuvrir }: { selection: SelectionPlanning & { employe: string }; aujourdhui: string; peutOuvrir: boolean }) {
  const { debut, fin } = selection.vue === "mensuel" ? bornesDuMois(selection.mois) : { debut: `${selection.annee}-01-01`, fin: `${selection.annee}-12-31` };
  let resultat;
  try {
    resultat = await chargerPlanningEmploye(selection.employe, debut, fin);
  } catch (erreur) {
    console.error("Échec du chargement du planning", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return <MessageErreur message={textes.echec} className="text-base" />;
  }
  if (!resultat.ok) return <MessageErreur message={textes.erreurs[resultat.erreur]} className="text-base" />;

  const jours = new Map(resultat.jours.map((jour) => [jour.jour, jour]));
  const commun = { jours, employeId: resultat.employe.id, aujourdhui, peutOuvrir };
  return (
    <>
      <ResumePlanning employe={resultat.employe} totaux={totaliser(resultat.jours)} />
      {selection.vue === "mensuel" ? <CalendrierMensuel mois={selection.mois} {...commun} /> : <PlanningAnnuel annee={selection.annee} {...commun} />}
      <LegendePlanning codesColores={resultat.codesColores} />
    </>
  );
}
