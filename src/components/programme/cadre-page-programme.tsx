import { Suspense, type ReactNode } from "react";
import { Chargement } from "@/components/ui/chargement";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { MessageErreur } from "@/components/ui/message-erreur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder, type Page } from "@/lib/metier/droits";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";

/** Titre et contenu chargé d'une page du module Programme. */
export function CadrePageProgramme({
  titre,
  chargement,
  children,
}: {
  titre: string;
  chargement: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <EnTetePage titre={titre} />
      <Suspense fallback={<Chargement message={chargement} />}>{children}</Suspense>
    </div>
  );
}

/**
 * Chaque page du planning exige d'avoir été accordée au compte (moindre privilège : les groupes
 * et affectations contiennent des noms d'employés). Renvoie le message à afficher sinon.
 */
export async function refusSiNonAutorise(page: Page): Promise<ReactNode | null> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (peutAcceder(utilisateur, page)) return null;
  return <MessageErreur message={TEXTES_PROGRAMME.commun.droits} className="text-base" />;
}
