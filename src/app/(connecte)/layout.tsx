import { Suspense, type ReactNode } from "react";
import { BarreNavigation } from "@/components/tableau-de-bord/barre-navigation";
import { CadreTableauDeBord } from "@/components/tableau-de-bord/cadre-tableau-de-bord";
import { MenuUtilisateur } from "@/components/tableau-de-bord/menu-utilisateur";
import { lireLogoAffiche, type LogoAffiche } from "@/lib/donnees/entreprise";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";

/** Compte connecté, lu à la requête (donc sous <Suspense>). */
async function CompteUtilisateur() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return <MenuUtilisateur nom={utilisateur.nom} identifiant={utilisateur.identifiant} />;
}

/** Menus limités aux pages du compte (relues à chaque requête : un droit retiré disparaît aussitôt). */
async function NavigationSelonDroits({ logoEntreprise }: { logoEntreprise: LogoAffiche | null }) {
  const { estSuperAdmin, pages } = await obtenirUtilisateurPourEspace();
  return <BarreNavigation droits={{ estSuperAdmin, pages }} logoEntreprise={logoEntreprise} />;
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

export default async function LayoutConnecte({ children }: { children: ReactNode }) {
  // Logo de l'entreprise : lu en cache (même pour tous les comptes), à côté du logo PS Time et dans le tiroir.
  const logoEntreprise = await lireLogoAffiche();
  return (
    <CadreTableauDeBord
      logoEntreprise={logoEntreprise}
      navigation={
        <Suspense fallback={<NavigationEnChargement />}>
          <NavigationSelonDroits logoEntreprise={logoEntreprise} />
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
