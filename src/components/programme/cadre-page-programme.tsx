import { Suspense, type ReactNode } from "react";
import { Chargement } from "@/components/ui/chargement";
import { MessageErreur } from "@/components/ui/message-erreur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";

/** Titre, sous-titre et contenu chargé d'une page du module Programme. */
export function CadrePageProgramme({
  titre,
  sousTitre,
  chargement,
  children,
}: {
  titre: string;
  sousTitre: string;
  chargement: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marine sm:text-[1.75rem]">{titre}</h1>
        <p className="mt-1.5 max-w-2xl text-base text-texte-secondaire">{sousTitre}</p>
      </div>
      <Suspense fallback={<Chargement message={chargement} />}>{children}</Suspense>
    </div>
  );
}

/**
 * Le module Programme est réservé aux super administrateurs (moindre privilège : les groupes
 * et affectations contiennent des noms d'employés). Renvoie le message à afficher sinon.
 */
export async function refusSiNonAutorise(): Promise<ReactNode | null> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (utilisateur.estSuperAdmin) return null;
  return <MessageErreur message={TEXTES_PROGRAMME.commun.droits} className="text-base" />;
}
