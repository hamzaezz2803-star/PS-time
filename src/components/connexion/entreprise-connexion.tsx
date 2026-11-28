import { LogoEntreprise } from "@/components/entreprise/logo-entreprise";
import { lireLogoAffiche } from "@/lib/donnees/entreprise";

/**
 * Nom et logo de l'entreprise en haut à droite de la partie blanche, à la même hauteur et à la
 * même taille que le logo PS Time de la partie bleue (en miroir). Rien sans logo.
 */
export async function EntrepriseConnexion() {
  const logo = await lireLogoAffiche();
  if (!logo) return null;
  return (
    <div data-entreprise="" className="mb-8 flex items-center justify-end gap-3 lg:absolute lg:end-14 lg:top-10 lg:mb-0 xl:top-12">
      <span className="min-w-0 truncate text-xl font-bold tracking-tight text-marine lg:text-2xl" title={logo.nom}>{logo.nom}</span>
      <LogoEntreprise logo={logo} className="size-14 rounded-xl p-1.5 shadow-carte" classeImage="size-full" />
    </div>
  );
}
