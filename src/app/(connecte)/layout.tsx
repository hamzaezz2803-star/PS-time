import { Suspense, type ReactNode } from "react";
import { CadreTableauDeBord } from "@/components/tableau-de-bord/cadre-tableau-de-bord";
import { MenuLateral } from "@/components/tableau-de-bord/menu-lateral";
import { MenuUtilisateur } from "@/components/tableau-de-bord/menu-utilisateur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";

/** Compte connecté, lu à la requête (donc sous <Suspense>). */
async function CompteUtilisateur() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return <MenuUtilisateur nom={utilisateur.nom} identifiant={utilisateur.identifiant} />;
}

/** Menu limité aux modules du compte (relu à chaque requête : un droit retiré disparaît aussitôt). */
async function MenuSelonDroits() {
  const { estSuperAdmin, modules } = await obtenirUtilisateurPourEspace();
  return <MenuLateral droits={{ estSuperAdmin, modules }} />;
}

function CompteEnChargement() {
  return (
    <div className="flex min-h-12 items-center gap-2.5 p-1.5" aria-hidden="true">
      <span className="size-8 shrink-0 rounded-md bg-menu-survol" />
      <span className="h-4 flex-1 rounded bg-menu-survol" />
    </div>
  );
}

function MenuEnChargement() {
  return (
    <div className="flex flex-col gap-2 px-1" aria-hidden="true">
      {[0, 1, 2, 3].map((rang) => (
        <span key={rang} className="h-9 rounded-lg bg-menu-survol" />
      ))}
    </div>
  );
}

export default function LayoutConnecte({ children }: { children: ReactNode }) {
  return (
    <CadreTableauDeBord
      menu={
        <Suspense fallback={<MenuEnChargement />}>
          <MenuSelonDroits />
        </Suspense>
      }
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
