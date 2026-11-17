import "server-only";

import { COLONNES_EXPORT_EMPLOYES, type LigneExportEmploye } from "@/lib/metier/export-employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { genererClasseur } from "./classeur";

const { export: textes, liste } = TEXTES_PERSONNES;

const TITRES: Record<keyof LigneExportEmploye, string> = {
  matricule: liste.matricule,
  numeroBadge: liste.numeroBadge,
  nom: liste.nomComplet,
  prenom: textes.prenom,
  departement: liste.departement,
  poste: liste.poste,
  telephone: liste.telephone,
  dateEmbauche: liste.dateEmbauche,
};

// Matricule, badge et téléphone restent du texte (zéros en tête conservés).
const COLONNES_TEXTE = new Set<keyof LigneExportEmploye>(["matricule", "numeroBadge", "telephone"]);

/** Classeur Excel de la liste des employés (mise en forme commune : lib/export/classeur.ts). */
export async function genererClasseurEmployes(lignes: LigneExportEmploye[], sousTitre: string): Promise<ArrayBuffer> {
  return genererClasseur({
    titre: textes.titreDocument,
    sousTitre,
    nomFeuille: textes.nomFeuille,
    mention: textes.confidentiel,
    libellePage: textes.page,
    colonnes: COLONNES_EXPORT_EMPLOYES.map(({ cle, largeur }) => ({ titre: TITRES[cle], largeur, estTexte: COLONNES_TEXTE.has(cle) })),
    lignes: lignes.map((ligne) => COLONNES_EXPORT_EMPLOYES.map(({ cle }) => ligne[cle])),
  });
}
