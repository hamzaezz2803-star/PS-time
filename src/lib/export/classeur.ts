import "server-only";

import ExcelJS from "exceljs";

// Excel ne lit pas les variables CSS : mêmes couleurs que globals.css, au format ARGB.
const COULEURS = {
  primaire: "FF0B4FB3",
  marine: "FF0A2463",
  texteSecondaire: "FF55627C",
  bordure: "FFE2E8F1",
  fondLigne: "FFF6F9FD",
  blanc: "FFFFFFFF",
} as const;

const LIGNE_EN_TETE = 4;
const BORDURE_FINE: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COULEURS.bordure } },
  bottom: { style: "thin", color: { argb: COULEURS.bordure } },
  left: { style: "thin", color: { argb: COULEURS.bordure } },
  right: { style: "thin", color: { argb: COULEURS.bordure } },
};

export type ColonneClasseur = {
  titre: string;
  largeur: number;
  /** Vrai : gardée en texte (matricule, téléphone : zéros en tête conservés). */
  estTexte?: boolean;
};

export type DefinitionClasseur = {
  titre: string;
  /** Ligne sous le titre (« Généré le … · N lignes »). */
  sousTitre: string;
  nomFeuille: string;
  /** Pied de page imprimé : mention à gauche, « Page n / N » à droite. */
  mention: string;
  libellePage: string;
  colonnes: ColonneClasseur[];
  lignes: string[][];
};

function ajouterTitre(feuille: ExcelJS.Worksheet, definition: DefinitionClasseur) {
  const derniereColonne = definition.colonnes.length;
  feuille.mergeCells(1, 1, 1, derniereColonne);
  feuille.mergeCells(2, 1, 2, derniereColonne);
  const titre = feuille.getCell(1, 1);
  titre.value = definition.titre;
  titre.font = { bold: true, size: 16, color: { argb: COULEURS.marine } };
  feuille.getRow(1).height = 26;
  const detail = feuille.getCell(2, 1);
  detail.value = definition.sousTitre;
  detail.font = { size: 10, color: { argb: COULEURS.texteSecondaire } };
}

function ajouterEnTete(feuille: ExcelJS.Worksheet, colonnes: ColonneClasseur[]) {
  const ligne = feuille.getRow(LIGNE_EN_TETE);
  colonnes.forEach(({ titre }, index) => {
    const cellule = ligne.getCell(index + 1);
    cellule.value = titre;
    cellule.font = { bold: true, color: { argb: COULEURS.blanc } };
    cellule.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COULEURS.primaire } };
    cellule.alignment = { vertical: "middle" };
    cellule.border = BORDURE_FINE;
  });
  ligne.height = 24;
}

function ajouterLignes(feuille: ExcelJS.Worksheet, lignes: string[][]) {
  lignes.forEach((valeurs, position) => {
    const ligne = feuille.getRow(LIGNE_EN_TETE + 1 + position);
    valeurs.forEach((valeur, index) => {
      const cellule = ligne.getCell(index + 1);
      cellule.value = valeur;
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
export async function genererClasseur(definition: DefinitionClasseur): Promise<ArrayBuffer> {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = "PS Time";
  classeur.created = new Date();

  const feuille = classeur.addWorksheet(definition.nomFeuille, {
    views: [{ state: "frozen", ySplit: LIGNE_EN_TETE, showGridLines: false }],
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `${LIGNE_EN_TETE}:${LIGNE_EN_TETE}` },
    headerFooter: { oddFooter: `&L${definition.mention}&R${definition.libellePage} &P / &N` },
  });
  feuille.columns = definition.colonnes.map(({ largeur }) => ({ width: largeur }));
  definition.colonnes.forEach((colonne, index) => {
    if (colonne.estTexte) feuille.getColumn(index + 1).numFmt = "@";
  });

  ajouterTitre(feuille, definition);
  ajouterEnTete(feuille, definition.colonnes);
  ajouterLignes(feuille, definition.lignes);
  feuille.autoFilter = { from: { row: LIGNE_EN_TETE, column: 1 }, to: { row: LIGNE_EN_TETE, column: definition.colonnes.length } };

  return classeur.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
