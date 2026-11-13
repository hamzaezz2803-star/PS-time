import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { KeyRound } from "lucide-react";
import { EnTeteEspace } from "@/components/espace/en-tete-espace";
import { Chargement } from "@/components/ui/chargement";
import { CHEMIN_CHANGER_MOT_DE_PASSE } from "@/lib/constantes";
import { obtenirUtilisateurConnecte } from "@/lib/donnees/session";
import { TEXTES_ESPACE } from "@/lib/textes/espace";

export const metadata: Metadata = { title: TEXTES_ESPACE.titrePage };

export default function PageEspace() {
  return (
    <div className="flex min-h-dvh flex-col">
      <EnTeteEspace />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <Suspense fallback={<Chargement message={TEXTES_ESPACE.chargement} />}>
          <ContenuEspace />
        </Suspense>
      </main>
    </div>
  );
}

async function ContenuEspace() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (utilisateur.doitChangerMotDePasse) redirect(CHEMIN_CHANGER_MOT_DE_PASSE);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-marine">
        {TEXTES_ESPACE.bonjour(utilisateur.nom)}
      </h1>
      <p className="text-base text-texte-secondaire">
        {TEXTES_ESPACE.enConstruction}
      </p>
      <Link
        href={CHEMIN_CHANGER_MOT_DE_PASSE}
        className="inline-flex min-h-12 w-fit items-center gap-2 rounded-lg px-3 text-base font-semibold text-primaire transition-colors duration-150 hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
      >
        <KeyRound className="size-5" aria-hidden="true" />
        {TEXTES_ESPACE.changerMotDePasse}
      </Link>
    </section>
  );
}
