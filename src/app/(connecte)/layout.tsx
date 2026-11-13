import { Suspense, type ReactNode } from "react";
import { CadreTableauDeBord } from "@/components/tableau-de-bord/cadre-tableau-de-bord";
import { MenuUtilisateur } from "@/components/tableau-de-bord/menu-utilisateur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";

/** Compte connecté, lu à la requête (donc sous <Suspense>). */
async function CompteUtilisateur() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return <MenuUtilisateur nom={utilisateur.nom} email={utilisateur.email} />;
}

function CompteEnChargement() {
  return (
    <div className="flex min-h-12 items-center gap-2.5 p-1.5" aria-hidden="true">
      <span className="size-8 shrink-0 rounded-md bg-surface ring-1 ring-bordure" />
      <span className="h-4 flex-1 rounded bg-surface ring-1 ring-bordure" />
    </div>
  );
}

export default function LayoutConnecte({ children }: { children: ReactNode }) {
  return (
    <CadreTableauDeBord
      pied={
        <Suspense fallback={<CompteEnChargement />}>
          <CompteUtilisateur />
        </Suspense>
      }
    >
      {children}
    </CadreTableauDeBord>
  );
}
