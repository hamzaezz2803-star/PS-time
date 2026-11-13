import { Suspense, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { CadreTableauDeBord } from "@/components/tableau-de-bord/cadre-tableau-de-bord";
import { Bouton } from "@/components/ui/bouton";
import { deconnecter } from "@/lib/actions/deconnexion";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { TEXTES_ESPACE } from "@/lib/textes/espace";

/** Nom de l'utilisateur, lu à la requête (donc sous <Suspense>). */
async function NomUtilisateur() {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return (
    <span className="hidden text-base font-medium text-texte sm:inline">
      {utilisateur.nom}
    </span>
  );
}

function EnTete() {
  return (
    <div className="flex items-center gap-4">
      <Suspense fallback={null}>
        <NomUtilisateur />
      </Suspense>
      <form action={deconnecter}>
        <Bouton type="submit" variante="contour">
          <LogOut className="size-5" aria-hidden="true" />
          {TEXTES_ESPACE.deconnexion}
        </Bouton>
      </form>
    </div>
  );
}

export default function LayoutConnecte({ children }: { children: ReactNode }) {
  return <CadreTableauDeBord enTete={<EnTete />}>{children}</CadreTableauDeBord>;
}
