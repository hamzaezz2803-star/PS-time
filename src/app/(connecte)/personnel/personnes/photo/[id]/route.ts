import { z } from "zod";
import { obtenirPhotoEmploye } from "@/lib/donnees/photos-employes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";

const identifiantEmploye = z.uuid();

/**
 * Photo de profil d'un employé. Jamais publique : servie seulement à un super administrateur
 * connecté (même règle que la fiche), et jamais gardée dans un cache partagé.
 */
export async function GET(_requete: Request, { params }: RouteContext<"/personnel/personnes/photo/[id]">) {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!utilisateur.estSuperAdmin) return new Response(null, { status: 403 });

  const id = identifiantEmploye.safeParse((await params).id);
  if (!id.success) return new Response(null, { status: 404 });

  const photo = await obtenirPhotoEmploye(id.data);
  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.contenu), {
    headers: {
      "Content-Type": photo.typeMime,
      // L'URL change avec la photo (?v=…) : le navigateur peut la garder, pour lui seul.
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
