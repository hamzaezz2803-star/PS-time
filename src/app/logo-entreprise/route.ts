import { lireContenuLogo } from "@/lib/donnees/entreprise";

/** Le logo d'une adresse versionnée (?v=…) ne change jamais : un an de cache. */
const CACHE_VERSIONNE = "public, max-age=31536000, immutable";

/**
 * Logo de l'entreprise, lisible sans session (écran de connexion) : seule information de
 * l'entreprise servie publiquement, en lecture seule. Les pages l'appellent avec ?v=<version> :
 * l'adresse change avec le logo, donc un changement s'affiche aussitôt.
 */
export async function GET(requete: Request) {
  let logo;
  try {
    logo = await lireContenuLogo();
  } catch (erreur) {
    console.error("Échec de la lecture du logo de l'entreprise", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!logo) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

  const versionDemandee = new URL(requete.url).searchParams.get("v");
  return new Response(new Uint8Array(logo.contenu), {
    headers: {
      "Content-Type": logo.typeMime,
      // Ancienne version ou adresse sans version : toujours revérifiée.
      "Cache-Control": versionDemandee === String(logo.version) ? CACHE_VERSIONNE : "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
