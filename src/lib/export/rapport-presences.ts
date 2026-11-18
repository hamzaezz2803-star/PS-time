import "server-only";

import { tracer } from "@/lib/actions/notifier";
import { CHEMIN_RAPPORT_PRESENCES } from "@/lib/constantes";
import { chargerRapport } from "@/lib/donnees/rapport-presences";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { formaterDate, formaterHeure, formaterJour } from "@/lib/formats";
import { peutAcceder } from "@/lib/metier/droits";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_HISTORIQUE } from "@/lib/textes/historique";
import { TEXTES_RAPPORT } from "@/lib/textes/rapport-presences";
import type { RechercheRapport } from "@/lib/validation/rapport-presences";
import { genererClasseur, type ColonneClasseur } from "./classeur";

const { tableau, document } = TEXTES_RAPPORT;

export const COLONNES_RAPPORT: ColonneClasseur[] = [
  { titre: tableau.matricule, largeur: 14, estTexte: true },
  { titre: tableau.employe, largeur: 28 },
  { titre: tableau.departement, largeur: 24 },
  { titre: tableau.date, largeur: 20 },
  { titre: tableau.premierPointage, largeur: 18 },
  { titre: tableau.horaire, largeur: 30 },
];

export type ExportRapport = { titre: string; sousTitre: string; nomFichier: string; lignes: string[][]; estTronque: boolean };

/**
 * Vérifie les droits (page Rapport des présences), lit le rapport, le met en lignes de texte et trace
 * l'export dans le journal du serveur et l'historique. Null si l'utilisateur n'y a pas droit.
 */
export async function preparerExportRapport(format: "excel" | "pdf", recherche: RechercheRapport): Promise<ExportRapport | null> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "rapport_presences")) return null;

  const rapport = await chargerRapport(recherche);
  // Journal d'audit (action sensible) : qui, quoi, combien. Aucune donnée d'employé.
  console.info("Export du rapport des présences", { utilisateurId: utilisateur.id, format, lignes: rapport.lignes.length, du: recherche.du, au: recherche.au });
  const periode = document.periode(formaterJour(recherche.du), formaterJour(recherche.au));
  await tracer("export", "rapport_presences", `${TEXTES_HISTORIQUE.libelleExport(format, rapport.lignes.length)} · ${periode}`, CHEMIN_RAPPORT_PRESENCES);

  const maintenant = new Date();
  return {
    titre: document.titre,
    sousTitre: `${document.periode(formaterJour(recherche.du), formaterJour(recherche.au))} · ${tableau.total(rapport.lignes.length)} · ${document.genereLe(formaterDate(maintenant), formaterHeure(maintenant))}`,
    nomFichier: document.nomFichier(recherche.du, recherche.au),
    lignes: rapport.lignes.map((ligne) => [
      ligne.matricule,
      ligne.nomComplet,
      ligne.departement,
      formaterJour(ligne.jour),
      minutesVersHeure(ligne.minutes),
      ligne.profil ? `${ligne.profil.code} · ${ligne.profil.nom}` : tableau.aucunHoraire,
    ]),
    estTronque: rapport.estTronque,
  };
}

/** Classeur Excel du rapport (mise en forme commune). */
export function genererClasseurRapport(donnees: ExportRapport): Promise<ArrayBuffer> {
  return genererClasseur({
    titre: donnees.titre,
    sousTitre: donnees.sousTitre,
    nomFeuille: document.nomFeuille,
    mention: document.confidentiel,
    libellePage: document.page,
    colonnes: COLONNES_RAPPORT,
    lignes: donnees.lignes,
  });
}

