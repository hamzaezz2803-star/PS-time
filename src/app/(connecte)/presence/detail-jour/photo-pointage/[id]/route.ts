import { z } from "zod";
import { lirePhotoPointage } from "@/lib/donnees/pointage-distance";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";

const identifiantPointage = z.uuid();

/**
 * Photo prise par l'employé lors d'un pointage à distance. Jamais publique : servie seulement
 * aux comptes qui ont la page Détail jour (où le pointage est affiché), jamais en cache partagé.
 */
export async function GET(_requete: Request, { params }: RouteContext<"/presence/detail-jour/photo-pointage/[id]">) {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "detail_jour")) return new Response(null, { status: 403 });

  const id = identifiantPointage.safeParse((await params).id);
  if (!id.success) return new Response(null, { status: 404 });

  const photo = await lirePhotoPointage(id.data);
  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.contenu), {
    headers: {
      "Content-Type": photo.typeMime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
