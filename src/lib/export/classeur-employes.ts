import "server-only";

import ExcelJS from "exceljs";
import { COLONNES_EXPORT_EMPLOYES, type LigneExportEmploye } from "@/lib/metier/export-employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

const { export: textes, liste } = TEXTES_PERSONNES;

// Excel ne lit pas les variables CSS : mêmes couleurs que globals.css, au format ARGB.
const COULEURS = {
  primaire: "FF0B4FB3",
  marine: "FF0A2463",
  texteSecondaire: "FF55627C",
  bordure: "FFE2E8F1",
  fondLigne: "FFF6F9FD",
  blanc: "FFFFFFFF",
} as const;

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

const LIGNE_EN_TETE = 4;
const BORDURE_FINE: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COULEURS.bordure } },
  bottom: { style: "thin", color: { argb: COULEURS.bordure } },
  left: { style: "thin", color: { argb: COULEURS.bordure } },
  right: { style: "thin", color: { argb: COULEURS.bordure } },
};

/** Titre du document et ligne « Généré le … · N employés » au-dessus du tableau. */
function ajouterTitre(feuille: ExcelJS.Worksheet, sousTitre: string) {
  const derniereColonne = COLONNES_EXPORT_EMPLOYES.length;
  feuille.mergeCells(1, 1, 1, derniereColonne);
  feuille.mergeCells(2, 1, 2, derniereColonne);
  const titre = feuille.getCell(1, 1);
  titre.value = textes.titreDocument;
  titre.font = { bold: true, size: 16, color: { argb: COULEURS.marine } };
  feuille.getRow(1).height = 26;
  const detail = feuille.getCell(2, 1);
  detail.value = sousTitre;
  detail.font = { size: 10, color: { argb: COULEURS.texteSecondaire } };
}

function ajouterEnTete(feuille: ExcelJS.Worksheet) {
  const ligne = feuille.getRow(LIGNE_EN_TETE);
  COLONNES_EXPORT_EMPLOYES.forEach(({ cle }, index) => {
    const cellule = ligne.getCell(index + 1);
    cellule.value = TITRES[cle];
    cellule.font = { bold: true, color: { argb: COULEURS.blanc } };
    cellule.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COULEURS.primaire } };
    cellule.alignment = { vertical: "middle" };
    cellule.border = BORDURE_FINE;
  });
  ligne.height = 24;
}

function ajouterLignes(feuille: ExcelJS.Worksheet, lignes: LigneExportEmploye[]) {
  lignes.forEach((donnees, position) => {
    const ligne = feuille.getRow(LIGNE_EN_TETE + 1 + position);
    COLONNES_EXPORT_EMPLOYES.forEach(({ cle }, index) => {
      const cellule = ligne.getCell(index + 1);
      cellule.value = donnees[cle];
      cellule.border = BORDURE_FINE;
      cellule.alignment = { vertical: "middle" };
      // Une ligne sur deux légèrement teintée : plus facile à suivre sur un long tableau.
      if (position % 2 === 1) cellule.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COULEURS.fondLigne } };
    });
    ligne.getCell(1).font = { bold: true, color: { argb: COULEURS.marine } };
    ligne.height = 20;
  });
}

/** Classeur Excel mis en forme : titre, en-tête figé et filtrable, colonnes ajustées, prêt à imprimer. */
export async function genererClasseurEmployes(lignes: LigneExportEmploye[], sousTitre: string): Promise<ArrayBuffer> {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = "PS Time";
  classeur.created = new Date();

  const feuille = classeur.addWorksheet(textes.nomFeuille, {
    views: [{ state: "frozen", ySplit: LIGNE_EN_TETE, showGridLines: false }],
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `${LIGNE_EN_TETE}:${LIGNE_EN_TETE}` },
    headerFooter: { oddFooter: `&L${textes.confidentiel}&R${textes.page} &P / &N` },
  });
  feuille.columns = COLONNES_EXPORT_EMPLOYES.map(({ largeur }) => ({ width: largeur }));
  // Matricule, badge et téléphone restent du texte (zéros en tête conservés).
  [1, 2, 7].forEach((colonne) => (feuille.getColumn(colonne).numFmt = "@"));

  ajouterTitre(feuille, sousTitre);
  ajouterEnTete(feuille);
  ajouterLignes(feuille, lignes);
  feuille.autoFilter = { from: { row: LIGNE_EN_TETE, column: 1 }, to: { row: LIGNE_EN_TETE, column: COLONNES_EXPORT_EMPLOYES.length } };

  return classeur.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
