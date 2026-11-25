/**
 * Écriture et relecture des instructions INSERT d'une sauvegarde (syntaxe PostgreSQL).
 * Toutes les valeurs sont écrites en texte (`E'...'`) ou NULL : PostgreSQL les convertit vers le
 * type de la colonne (date, booléen, nombre, octets en `\x...`). La relecture n'exécute rien :
 * elle transforme une ligne en données (table, colonnes, valeurs), refusée au moindre écart.
 * Fonctions pures, testées dans sauvegarde-sql.test.ts.
 */

/** Valeur relue : texte (PostgreSQL le convertit vers le type de la colonne) ou NULL. */
export type ValeurSql = string | null;

export type Insertion = { table: string; colonnes: string[]; lignes: ValeurSql[][] };

const ECHAPPEMENTS: Record<string, string> = { "\\": "\\\\", "'": "\\'", "\n": "\\n", "\r": "\\r" };
const DESECHAPPEMENTS: Record<string, string> = { "\\": "\\", "'": "'", n: "\n", r: "\r" };
const NOM_SQL = /^[a-z][a-z0-9_]{0,62}$/;

export const estNomSql = (nom: string) => NOM_SQL.test(nom);

/** Littéral SQL d'une valeur lue en texte. Pas de retour à la ligne : une instruction = une ligne. */
export function valeurSql(valeur: string | null): string {
  if (valeur === null) return "NULL";
  if (valeur.includes("\0")) throw new Error("Caractère nul non sauvegardable");
  return `E'${valeur.replace(/[\\'\n\r]/g, (caractere) => ECHAPPEMENTS[caractere])}'`;
}

const nomSql = (nom: string) => `"${nom}"`;

export function instructionInsert(table: string, colonnes: readonly string[], lignes: readonly string[][]): string {
  const valeurs = lignes.map((ligne) => `(${ligne.join(",")})`).join(",");
  return `INSERT INTO ${nomSql(table)} (${colonnes.map(nomSql).join(",")}) VALUES ${valeurs};`;
}

/** Lecteur pas à pas d'une ligne ; chaque méthode renvoie null si le texte attendu n'est pas là. */
class Lecteur {
  position = 0;
  private readonly texte: string;
  constructor(texte: string) {
    this.texte = texte;
  }

  fini = () => this.position >= this.texte.length;

  lire(attendu: string): boolean {
    if (!this.texte.startsWith(attendu, this.position)) return false;
    this.position += attendu.length;
    return true;
  }

  nomEntreGuillemets(): string | null {
    if (!this.lire('"')) return null;
    const fin = this.texte.indexOf('"', this.position);
    if (fin < 0) return null;
    const nom = this.texte.slice(this.position, fin);
    this.position = fin + 1;
    return estNomSql(nom) ? nom : null;
  }

  chaine(): string | null {
    if (!this.lire("E'")) return null;
    let resultat = "";
    while (!this.fini()) {
      const caractere = this.texte[this.position++];
      if (caractere === "'") return resultat;
      if (caractere === "\\") {
        const suivant = DESECHAPPEMENTS[this.texte[this.position++]];
        if (suivant === undefined) return null;
        resultat += suivant;
      } else resultat += caractere;
    }
    return null;
  }

  /** Une valeur : NULL ou E'texte'. `undefined` si rien de reconnu. */
  valeur(): ValeurSql | undefined {
    if (this.lire("NULL")) return null;
    return this.chaine() ?? undefined;
  }

  liste<T>(lireElement: () => T | undefined): T[] | null {
    if (!this.lire("(")) return null;
    const elements: T[] = [];
    do {
      const element = lireElement();
      if (element === undefined) return null;
      elements.push(element);
    } while (this.lire(","));
    return this.lire(")") ? elements : null;
  }
}

/** Relit une ligne `INSERT INTO "t" ("a","b") VALUES (...),(...);` ; null si elle ne suit pas exactement ce format. */
export function lireInsertion(ligne: string): Insertion | null {
  const lecteur = new Lecteur(ligne);
  if (!lecteur.lire("INSERT INTO ")) return null;
  const table = lecteur.nomEntreGuillemets();
  if (!table || !lecteur.lire(" ")) return null;
  const colonnes = lecteur.liste(() => lecteur.nomEntreGuillemets() ?? undefined);
  if (!colonnes || !lecteur.lire(" VALUES ")) return null;
  const lignes: ValeurSql[][] = [];
  do {
    const valeurs = lecteur.liste(() => lecteur.valeur());
    if (!valeurs || valeurs.length !== colonnes.length) return null;
    lignes.push(valeurs);
  } while (lecteur.lire(","));
  if (!lecteur.lire(";") || !lecteur.fini()) return null;
  return { table, colonnes, lignes };
}
