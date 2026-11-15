import { genererClasseurEmployes } from "@/lib/export/classeur-employes";
import { preparerExportEmployes } from "@/lib/export/preparer-export-employes";
import type { NextRequest } from "next/server";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { lireRechercheEmployes } from "@/lib/validation/recherche-employes";

const TYPE_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Téléchargement de la liste des employés au format Excel (super administrateurs). */
export async function GET(requete: NextRequest) {
  const recherche = lireRechercheEmployes(Object.fromEntries(requete.nextUrl.searchParams));
  const donnees = await preparerExportEmployes("excel", recherche);
  if (!donnees) return new Response(TEXTES_PERSONNES.droits, { status: 403 });

  try {
    const fichier = await genererClasseurEmployes(donnees.lignes, donnees.sousTitre);
    return new Response(fichier, {
      headers: {
        "Content-Type": TYPE_XLSX,
        "Content-Disposition": `attachment; filename="${donnees.nomFichier}.xlsx"`,
        // Données personnelles : jamais gardées en cache par le navigateur ou un proxy.
        "Cache-Control": "no-store",
      },
    });
  } catch (erreur) {
    console.error("Échec de la génération de l'export Excel des employés", {
      erreur: erreur instanceof Error ? erreur.name : "inconnue",
    });
    return new Response(TEXTES_PERSONNES.export.echec, { status: 500 });
  }
}
