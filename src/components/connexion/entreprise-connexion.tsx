import { LogoEntreprise } from "@/components/entreprise/logo-entreprise";
import { lireLogoAffiche } from "@/lib/donnees/entreprise";

/** Logo et nom de l'entreprise au-dessus du titre de la connexion, s'il y a un logo (sinon rien). */
export async function EntrepriseConnexion() {
  const logo = await lireLogoAffiche();
  if (!logo) return null;
  return (
    <div className="mb-6 flex items-center gap-3">
      <LogoEntreprise logo={logo} className="size-14 rounded-xl p-1.5 shadow-carte" classeImage="size-full" />
      <span className="min-w-0 text-xl font-bold tracking-tight text-marine">{logo.nom}</span>
    </div>
  );
}
