import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { KeyRound } from "lucide-react";
import { EnTeteEspace } from "@/components/espace/en-tete-espace";
import { AccueilEmploye, PointagesDuJour, RefusPointage } from "@/components/pointage-distance/accueil-employe";
import { EcranPointage } from "@/components/pointage-distance/ecran-pointage";
import { Chargement } from "@/components/ui/chargement";
import { MessageErreur } from "@/components/ui/message-erreur";
import { CHEMIN_CHANGER_MOT_DE_PASSE } from "@/lib/constantes";
import { lireEmployePourPointage, listerPointagesDuJour } from "@/lib/donnees/pointage-distance";
import { obtenirEmployeConnecte } from "@/lib/donnees/session";
import { detecterAppareil } from "@/lib/metier/pointage-distance";
import { TEXTES_POINTAGE_DISTANCE } from "@/lib/textes/pointage-distance";

const textes = TEXTES_POINTAGE_DISTANCE;

export const metadata: Metadata = { title: textes.titrePage };

/** Espace de l'employé : bonjour, ses informations, puis le pointage (position, photo, bouton). */
export default function PagePointage() {
  return (
    <div className="flex min-h-dvh flex-col bg-fond">
      <EnTeteEspace />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:py-8 lg:gap-6">
        <Suspense fallback={<Chargement message={textes.chargement} />}>
          <ContenuPointage />
        </Suspense>
        <Link href={CHEMIN_CHANGER_MOT_DE_PASSE} className="inline-flex min-h-11 items-center justify-center gap-2 self-center rounded-lg px-3 text-base font-medium text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire">
          <KeyRound className="size-5" aria-hidden="true" />
          {textes.motDePasse}
        </Link>
      </main>
    </div>
  );
}

/** Raison du refus, ou null si l'employé peut pointer depuis cet appareil. */
function motifRefus(estAutorise: boolean, appareil: keyof typeof textes.appareils, autorises: (keyof typeof textes.appareils)[]): string | null {
  if (!estAutorise) return textes.refus.nonAutorise;
  if (!autorises.includes(appareil)) return textes.refus.appareil(textes.appareils[appareil], autorises.map((nom) => textes.appareils[nom]).join(", "));
  return null;
}

async function ContenuPointage() {
  const utilisateur = await obtenirEmployeConnecte();
  const maintenant = new Date();
  const [employe, pointages, entetes] = await Promise.all([
    lireEmployePourPointage(utilisateur.employeId),
    listerPointagesDuJour(utilisateur.employeId, maintenant),
    headers(),
  ]).catch(() => [null, [], null] as const);
  if (!employe || !entetes) return <MessageErreur message={textes.erreurs.echec} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />;

  const refus = motifRefus(employe.estAutorise, detecterAppareil(entetes.get("user-agent") ?? ""), employe.appareils);
  return (
    <>
      <AccueilEmploye employe={employe} maintenant={maintenant} />
      {refus ? (
        <div className="grid gap-5 lg:grid-cols-3 lg:items-start lg:gap-6">
          <div className="lg:col-span-2">
            <RefusPointage message={refus} />
          </div>
          <PointagesDuJour pointages={pointages} />
        </div>
      ) : (
        <EcranPointage
          exigePosition={employe.exigePosition}
          exigePhoto={employe.exigePhoto}
          dernierEtat={pointages.at(-1)?.etat ?? null}
          aCote={<PointagesDuJour pointages={pointages} />}
        />
      )}
    </>
  );
}
