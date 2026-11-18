import { Suspense, type ReactNode } from "react";
import { BarreNavigation } from "@/components/tableau-de-bord/barre-navigation";
import { CadreTableauDeBord } from "@/components/tableau-de-bord/cadre-tableau-de-bord";
import { MenuUtilisateur } from "@/components/tableau-de-bord/menu-utilisateur";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";

/** Compte connecté, lu à la requête (donc sous <Suspense>). */
async function CompteUtilisateur() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return <MenuUtilisateur nom={utilisateur.nom} identifiant={utilisateur.identifiant} />;
}

/** Menus limités aux pages du compte (relues à chaque requête : un droit retiré disparaît aussitôt). */
async function NavigationSelonDroits() {
  const { estSuperAdmin, pages } = await obtenirUtilisateurPourEspace();
  return <BarreNavigation droits={{ estSuperAdmin, pages }} />;
}

function CompteEnChargement() {
  return <span className="size-9 shrink-0 rounded-md bg-canevas" aria-hidden="true" />;
}

function NavigationEnChargement() {
  return (
    <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
      {[0, 1, 2, 3].map((rang) => (
        <span key={rang} className="h-8 w-24 rounded-lg bg-canevas" />
      ))}
    </div>
  );
}

export default function LayoutConnecte({ children }: { children: ReactNode }) {
  return (
    <CadreTableauDeBord
      navigation={
        <Suspense fallback={<NavigationEnChargement />}>
          <NavigationSelonDroits />
        </Suspense>
      }
      compte={
        <Suspense fallback={<CompteEnChargement />}>
          <CompteUtilisateur />
        </Suspense>
      }
    >
      {children}
    </CadreTableauDeBord>
  );
}
