import type { NextRequest } from "next/server";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { genererClasseurRapport, preparerExportRapport } from "@/lib/export/rapport-presences";
import { TEXTES_RAPPORT } from "@/lib/textes/rapport-presences";
import { lireRechercheRapport } from "@/lib/validation/rapport-presences";

const TYPE_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Téléchargement du rapport des présences au format Excel (module Planning). */
export async function GET(requete: NextRequest) {
  const recherche = lireRechercheRapport(Object.fromEntries(requete.nextUrl.searchParams), aujourdhuiLocal());
  try {
    const donnees = await preparerExportRapport("excel", recherche);
    if (!donnees) return new Response(TEXTES_RAPPORT.droits, { status: 403 });
    const fichier = await genererClasseurRapport(donnees);
    return new Response(fichier, {
      headers: {
        "Content-Type": TYPE_XLSX,
        "Content-Disposition": `attachment; filename="${donnees.nomFichier}.xlsx"`,
        // Données personnelles : jamais gardées en cache par le navigateur ou un proxy.
        "Cache-Control": "no-store",
      },
    });
  } catch (erreur) {
    console.error("Échec de l'export Excel du rapport des présences", { erreur: erreur instanceof Error ? erreur.name : "inconnue" });
    return new Response(TEXTES_RAPPORT.document.echec, { status: 500 });
  }
}
