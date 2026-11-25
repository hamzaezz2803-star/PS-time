import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { CHEMIN_CONNEXION } from "@/lib/constantes";

/**
 * Redirection rapide vers la connexion quand aucun cookie de session n'existe.
 * Ce n'est PAS une vérification de sécurité : chaque page et chaque action
 * valide la session côté serveur (obtenirUtilisateurConnecte).
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL(CHEMIN_CONNEXION, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/espace/:path*", "/personnel/:path*", "/programme/:path*", "/exceptions/:path*", "/appareils/:path*", "/impression/:path*", "/changer-mot-de-passe", "/pointage"],
};
