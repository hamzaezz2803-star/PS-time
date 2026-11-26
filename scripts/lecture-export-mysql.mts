/**
 * Lecture d'un export phpMyAdmin (MySQL / MariaDB) : structure des tables, index, clés
 * étrangères et lignes de données. Le fichier est lu comme du texte, jamais exécuté.
 * Utilisé par scripts/mysql-vers-postgres.mts.
 */

export type Colonne = { nom: string; type: string; estNonNul: boolean; defaut: string | null };
export type IndexTable = { nom: string; colonnes: string[]; estUnique: boolean };
export type CleEtrangere = {
  nom: string;
  colonnes: string[];
  tableReferencee: string;
  colonnesReferencees: string[];
  surSuppression: string;
};
export type Table = {
  nom: string;
  colonnes: Colonne[];
  clePrimaire: string[];
  index: IndexTable[];
  clesEtrangeres: CleEtrangere[];
  aDateModificationAuto: boolean;
};
export type Valeur =
  | { genre: "nul" }
  | { genre: "nombre"; texte: string }
  | { genre: "texte"; texte: string }
  | { genre: "hexa"; texte: string };
export type Insertion = { table: string; colonnes: string[]; lignes: Valeur[][] };

/** Échappements MySQL dans une chaîne ('\n', '\'', ...). `\%` et `\_` gardent leur barre oblique. */
const ECHAPPEMENTS: Record<string, string> = {
  "0": "\0", n: "\n", r: "\r", t: "\t", b: "\b", Z: "\x1a", "\\": "\\", "'": "'", '"': '"',
};

const listeColonnes = (texte: string) => texte.split(",").map((nom) => nom.trim().replace(/`/g, ""));

function lireColonne(ligne: string, table: Table): void {
  const morceaux = /^\s*`(\w+)` (\w+(?:\([\d,]+\))?(?: UNSIGNED)?)(.*?),?$/.exec(ligne);
  if (!morceaux) throw new Error(`Colonne illisible dans ${table.nom} : ${ligne.trim()}`);
  const [, nom, type, suite] = morceaux;
  const defaut = /DEFAULT ('(?:[^']|'')*'|[^\s,]+)/.exec(suite)?.[1] ?? null;
  if (/ ON UPDATE /.test(suite)) table.aDateModificationAuto = true;
  table.colonnes.push({ nom, type, estNonNul: suite.includes("NOT NULL"), defaut: defaut === "NULL" ? null : defaut });
}

function lireStructures(texte: string): Map<string, Table> {
  const tables = new Map<string, Table>();
  for (const [, nom, corps] of texte.matchAll(/^CREATE TABLE `(\w+)` \(\n([\s\S]*?)\n\)[^;\n]*;$/gm)) {
    const table: Table = { nom, colonnes: [], clePrimaire: [], index: [], clesEtrangeres: [], aDateModificationAuto: false };
    for (const ligne of corps.split("\n")) lireColonne(ligne, table);
    tables.set(nom, table);
  }
  return tables;
}

function lireModifications(texte: string, tables: Map<string, Table>): void {
  for (const [, nom, corps] of texte.matchAll(/^ALTER TABLE `(\w+)`\n([\s\S]*?);$/gm)) {
    const table = tables.get(nom);
    if (!table) throw new Error(`ALTER TABLE sur une table inconnue : ${nom}`);
    for (const ligne of corps.split("\n")) {
      const primaire = /ADD PRIMARY KEY \(([^)]+)\)/.exec(ligne);
      const index = /ADD (UNIQUE )?KEY `(\w+)` \(([^)]+)\)/.exec(ligne);
      const cle = /ADD CONSTRAINT `(\w+)` FOREIGN KEY \(([^)]+)\) REFERENCES `(\w+)` \(([^)]+)\)(?: ON DELETE (CASCADE|SET NULL|RESTRICT|NO ACTION))?/.exec(ligne);
      if (primaire) table.clePrimaire = listeColonnes(primaire[1]);
      else if (index) table.index.push({ nom: index[2], colonnes: listeColonnes(index[3]), estUnique: Boolean(index[1]) });
      else if (cle) {
        table.clesEtrangeres.push({
          nom: cle[1],
          colonnes: listeColonnes(cle[2]),
          tableReferencee: cle[3],
          colonnesReferencees: listeColonnes(cle[4]),
          // Sans ON DELETE, MySQL refuse la suppression (RESTRICT).
          surSuppression: cle[5] ?? "RESTRICT",
        });
      }
    }
  }
}

function lireChaine(texte: string, debut: number): { valeur: Valeur; fin: number } {
  let resultat = "";
  let i = debut + 1;
  for (;;) {
    const caractere = texte[i];
    if (caractere === undefined) throw new Error("Chaîne non terminée dans l'export.");
    if (caractere === "\\") {
      const suivant = texte[i + 1];
      resultat += ECHAPPEMENTS[suivant] ?? (suivant === "%" || suivant === "_" ? `\\${suivant}` : suivant);
      i += 2;
    } else if (caractere === "'" && texte[i + 1] === "'") {
      resultat += "'";
      i += 2;
    } else if (caractere === "'") {
      return { valeur: { genre: "texte", texte: resultat }, fin: i + 1 };
    } else {
      resultat += caractere;
      i += 1;
    }
  }
}

function lireValeur(texte: string, debut: number): { valeur: Valeur; fin: number } {
  if (texte[debut] === "'") return lireChaine(texte, debut);
  if (texte.startsWith("NULL", debut)) return { valeur: { genre: "nul" }, fin: debut + 4 };
  const hexa = /0x([0-9a-fA-F]*)/y;
  hexa.lastIndex = debut;
  const correspondanceHexa = hexa.exec(texte);
  if (correspondanceHexa) return { valeur: { genre: "hexa", texte: correspondanceHexa[1] }, fin: hexa.lastIndex };
  const nombre = /-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/iy;
  nombre.lastIndex = debut;
  const correspondanceNombre = nombre.exec(texte);
  if (correspondanceNombre) return { valeur: { genre: "nombre", texte: correspondanceNombre[0] }, fin: nombre.lastIndex };
  throw new Error(`Valeur illisible dans l'export : ${texte.slice(debut, debut + 30)}`);
}

const sauterBlancs = (texte: string, debut: number) => {
  let i = debut;
  while (/\s/.test(texte[i] ?? "")) i += 1;
  return i;
};

function exiger(texte: string, position: number, attendu: string): void {
  if (texte[position] !== attendu) throw new Error(`« ${attendu} » attendu dans l'export : ${texte.slice(position, position + 30)}`);
}

/** Lit les lignes `(…), (…);` qui suivent un `INSERT … VALUES`. */
function lireLignes(texte: string, debut: number): { lignes: Valeur[][]; fin: number } {
  const lignes: Valeur[][] = [];
  let i = sauterBlancs(texte, debut);
  for (;;) {
    exiger(texte, i, "(");
    const ligne: Valeur[] = [];
    let separateur = ",";
    i += 1;
    while (separateur === ",") {
      const { valeur, fin } = lireValeur(texte, sauterBlancs(texte, i));
      ligne.push(valeur);
      i = sauterBlancs(texte, fin);
      separateur = texte[i];
      if (separateur !== "," && separateur !== ")") exiger(texte, i, ")");
      i += 1;
    }
    lignes.push(ligne);
    i = sauterBlancs(texte, i);
    if (texte[i] === ";") return { lignes, fin: i + 1 };
    exiger(texte, i, ",");
    i = sauterBlancs(texte, i + 1);
  }
}

function lireInsertions(texte: string): Insertion[] {
  const insertions: Insertion[] = [];
  const debutInsertion = /^INSERT INTO `(\w+)` \(([^)]*)\) VALUES\s*/gm;
  let correspondance = debutInsertion.exec(texte);
  while (correspondance) {
    const { lignes, fin } = lireLignes(texte, debutInsertion.lastIndex);
    insertions.push({ table: correspondance[1], colonnes: listeColonnes(correspondance[2]), lignes });
    debutInsertion.lastIndex = fin;
    correspondance = debutInsertion.exec(texte);
  }
  return insertions;
}

export function lireExportMysql(contenu: string): { tables: Map<string, Table>; insertions: Insertion[] } {
  // Les retours à la ligne des données sont échappés (\n) : seuls ceux de la mise en page sont remplacés.
  const texte = contenu.replace(/\r\n/g, "\n");
  const tables = lireStructures(texte);
  lireModifications(texte, tables);
  return { tables, insertions: lireInsertions(texte) };
}
