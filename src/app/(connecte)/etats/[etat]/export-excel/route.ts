import type { NextRequest } from "next/server";
import { aujourdhuiLocal } from "@/lib/donnees/compteurs-calcul";
import { genererClasseurEtat, preparerExportEtat } from "@/lib/export/etats";
import { estEtat } from "@/lib/metier/etats";
import { TEXTES_ETATS } from "@/lib/textes/etats";
import { TEXTES_RAPPORT } from "@/lib/textes/rapport-presences";
import { lireRechercheEtat } from "@/lib/validation/etats";

const TYPE_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Téléchargement d'un état au format Excel (droits revérifiés dans preparerExportEtat). */
export async function GET(requete: NextRequest, { params }: { params: Promise<{ etat: string }> }) {
  const { etat } = await params;
  if (!estEtat(etat)) return new Response(null, { status: 404 });
  const recherche = lireRechercheEtat(Object.fromEntries(requete.nextUrl.searchParams), aujourdhuiLocal());
  try {
    const donnees = await preparerExportEtat(etat, "excel", recherche);
    if (!donnees) return new Response(TEXTES_ETATS.droits, { status: 403 });
    const fichier = await genererClasseurEtat(donnees);
    return new Response(fichier, {
      headers: {
        "Content-Type": TYPE_XLSX,
        "Content-Disposition": `attachment; filename="${donnees.nomFichier}.xlsx"`,
        // Données personnelles : jamais gardées en cache par le navigateur ou un proxy.
        "Cache-Control": "no-store",
      },
    });
  } catch (erreur) {
    console.error("Échec de l'export Excel d'un état", { etat, erreur: erreur instanceof Error ? erreur.name : "inconnue" });
    return new Response(TEXTES_RAPPORT.document.echec, { status: 500 });
  }
}
