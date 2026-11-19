import type { Metadata } from "next";
import { Suspense } from "react";
import { UserRoundSearch } from "lucide-react";
import { z } from "zod";
import { BarreSelection } from "@/components/detail-jour/barre-selection";
import { CarteEvenementsJour } from "@/components/absences/carte-evenements-jour";
import { CarteHoraire, CartePointages, EnTeteEmploye } from "@/components/detail-jour/cartes-jour";
import { CompteursJour } from "@/components/detail-jour/compteurs-jour";
import { HistoriqueCompteurs } from "@/components/detail-jour/historique-compteurs";
import { NavigationDetail, ZoneDetail, type SelectionDetail } from "@/components/detail-jour/navigation-detail";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { DUREES_HISTORIQUE } from "@/lib/constantes";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { listerDepartements } from "@/lib/donnees/departements";
import { chargerDetailJour } from "@/lib/donnees/detail-jour";
import { listerEmployesSelection } from "@/lib/donnees/groupes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { TEXTES_DETAIL_JOUR as textes } from "@/lib/textes/detail-jour";

export const metadata: Metadata = { title: textes.titrePage };

type ParametresRecherche = Promise<Record<string, string | string[] | undefined>>;

/** Sélection lue dans l'URL et validée ; une valeur invalide reprend sa valeur par défaut. */
function lireSelection(parametres: Record<string, string | string[] | undefined>, aujourdhui: string): SelectionDetail {
  const texte = (nom: string) => (typeof parametres[nom] === "string" ? (parametres[nom] as string) : "");
  const employe = z.uuid().safeParse(texte("employe"));
  const jours = Number(texte("jours"));
  return {
    employe: employe.success ? employe.data : null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(texte("date")) ? texte("date") : aujourdhui,
    jours: (DUREES_HISTORIQUE as readonly number[]).includes(jours) ? jours : DUREES_HISTORIQUE[0],
  };
}

export default function PageDetailJour({ searchParams }: { searchParams: ParametresRecherche }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={textes.titrePage} sousTitre={textes.sousTitre} />
      <Suspense fallback={<Chargement message={textes.chargement} />}>
        <ContenuDetailJour searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ContenuDetailJour({ searchParams }: { searchParams: ParametresRecherche }) {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "detail_jour")) return <MessageErreur message={textes.droits} className="text-base" />;

  const aujourdhui = aujourdhuiLocal();
  const selection = lireSelection(await searchParams, aujourdhui);
  const [employes, departements] = await Promise.all([listerEmployesSelection(), listerDepartements()]);

  return (
    <NavigationDetail selection={selection}>
      <BarreSelection employes={employes} departements={departements} aujourdhui={aujourdhui} />
      <ZoneDetail>
        {selection.employe ? <Detail selection={{ ...selection, employe: selection.employe }} /> : <AucunEmploye />}
      </ZoneDetail>
    </NavigationDetail>
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

async function Detail({ selection }: { selection: SelectionDetail & { employe: string } }) {
  let resultat;
  try {
    resultat = await chargerDetailJour(selection.employe, selection.date, selection.jours);
  } catch (erreur) {
    console.error("Échec du chargement du détail jour", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return <MessageErreur message={textes.echec} className="text-base" />;
  }
  if (!resultat.ok) return <MessageErreur message={textes.erreurs[resultat.erreur]} className="text-base" />;

  const { detail } = resultat;
  return (
    <>
      <EnTeteEmploye detail={detail} />
      {detail.evenements.length > 0 && <CarteEvenementsJour evenements={detail.evenements} />}
      <div className="grid gap-6 lg:grid-cols-2">
        <CarteHoraire horaire={detail.horaire} />
        <CartePointages pointages={detail.pointages} />
      </div>
      <CompteursJour detail={detail} />
      <HistoriqueCompteurs detail={detail} />
    </>
  );
}
