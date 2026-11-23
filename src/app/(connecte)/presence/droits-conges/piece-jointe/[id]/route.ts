import { z } from "zod";
import { obtenirPieceJointe } from "@/lib/donnees/pieces-jointes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { dispositionEnLigne } from "@/lib/metier/pieces-jointes";

const identifiantPiece = z.uuid();

/**
 * Pièce justificative d'un droit aux congés. Jamais publique : servie seulement à un compte qui a
 * la page Droits aux congés, jamais gardée dans un cache partagé, ouverte dans un bac à sable.
 */
export async function GET(_requete: Request, { params }: RouteContext<"/presence/droits-conges/piece-jointe/[id]">) {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "droits_conges")) return new Response(null, { status: 403 });

  const id = identifiantPiece.safeParse((await params).id);
  if (!id.success) return new Response(null, { status: 404 });

  const piece = await obtenirPieceJointe(id.data);
  if (!piece) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(piece.contenu), {
    headers: {
      "Content-Type": piece.typeMime,
      "Content-Disposition": dispositionEnLigne(piece.nomFichier),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Aucun script ni chargement externe. Le bac à sable empêcherait Chrome d'afficher un PDF :
      // il n'est posé que sur les images (le lecteur PDF du navigateur n'exécute pas de script de page).
      "Content-Security-Policy": piece.typeMime === "application/pdf" ? "default-src 'none'; img-src 'self'; object-src 'self'" : "default-src 'none'; img-src 'self'; sandbox",
    },
  });
}
