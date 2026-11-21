/**
 * Écriture et relecture des instructions INSERT d'une sauvegarde. La relecture n'exécute rien :
 * elle transforme une ligne en données (table, colonnes, valeurs), refusée au moindre écart.
 * Fonctions pures, testées dans sauvegarde-sql.test.ts.
 */

/** Valeur relue : texte (nombres compris, MySQL les convertit), NULL ou octets. */
export type ValeurSql = string | null | Buffer;

export type Insertion = { table: string; colonnes: string[]; lignes: ValeurSql[][] };

const ECHAPPEMENTS: Record<string, string> = { "\\": "\\\\", "'": "\\'", "\0": "\\0", "\n": "\\n", "\r": "\\r", "\x1a": "\\Z" };
const DESECHAPPEMENTS: Record<string, string> = { "\\": "\\", "'": "'", '"': '"', "0": "\0", n: "\n", r: "\r", t: "\t", b: "\b", Z: "\x1a" };
const NOM_SQL = /^[a-z][a-z0-9_]{0,63}$/;
const NOMBRE = /^-?\d+(\.\d+)?(e[+-]?\d+)?/i;

export const estNomSql = (nom: string) => NOM_SQL.test(nom);

/** Littéral SQL d'une valeur lue en base (dates déjà en texte). Pas de retour à la ligne : une instruction = une ligne. */
export function valeurSql(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "NULL";
  if (typeof valeur === "number") {
    if (!Number.isFinite(valeur)) throw new Error("Nombre non représentable");
    return String(valeur);
  }
  if (typeof valeur === "bigint") return valeur.toString();
  if (typeof valeur === "boolean") return valeur ? "1" : "0";
  if (Buffer.isBuffer(valeur)) return `X'${valeur.toString("hex")}'`;
  if (typeof valeur === "string") return `'${valeur.replace(/[\\'\0\n\r\x1a]/g, (c) => ECHAPPEMENTS[c])}'`;
  throw new Error("Type de valeur non sauvegardable");
}

export function instructionInsert(table: string, colonnes: readonly string[], lignes: readonly string[][]): string {
  const valeurs = lignes.map((ligne) => `(${ligne.join(",")})`).join(",");
  return `INSERT INTO \`${table}\` (${colonnes.map((c) => `\`${c}\``).join(",")}) VALUES ${valeurs};`;
}

/** Lecteur pas à pas d'une ligne ; chaque méthode renvoie null si le texte attendu n'est pas là. */
class Lecteur {
  position = 0;
  constructor(private readonly texte: string) {}

  fini = () => this.position >= this.texte.length;

  lire(attendu: string): boolean {
    if (!this.texte.startsWith(attendu, this.position)) return false;
    this.position += attendu.length;
    return true;
  }

  nomEntreAccents(): string | null {
    if (!this.lire("`")) return null;
    const fin = this.texte.indexOf("`", this.position);
    if (fin < 0) return null;
    const nom = this.texte.slice(this.position, fin);
    this.position = fin + 1;
    return estNomSql(nom) ? nom : null;
  }

  chaine(): string | null {
    if (!this.lire("'")) return null;
    let resultat = "";
    while (!this.fini()) {
      const caractere = this.texte[this.position++];
      if (caractere === "'") {
        if (!this.lire("'")) return resultat;
        resultat += "'";
      } else if (caractere === "\\") {
        const suivant = DESECHAPPEMENTS[this.texte[this.position++]];
        if (suivant === undefined) return null;
        resultat += suivant;
      } else resultat += caractere;
    }
    return null;
  }

  /** Une valeur : NULL, nombre, 'texte' ou X'hexa'. `undefined` si rien de reconnu. */
  valeur(): ValeurSql | undefined {
    if (this.lire("NULL")) return null;
    if (this.lire("X'")) {
      const fin = this.texte.indexOf("'", this.position);
      const hexa = fin < 0 ? "" : this.texte.slice(this.position, fin);
      if (fin < 0 || hexa.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hexa)) return undefined;
      this.position = fin + 1;
      return Buffer.from(hexa, "hex");
    }
    if (this.texte[this.position] === "'") return this.chaine() ?? undefined;
    const nombre = NOMBRE.exec(this.texte.slice(this.position, this.position + 40));
    if (!nombre) return undefined;
    this.position += nombre[0].length;
    return nombre[0];
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

/** Relit une ligne `INSERT INTO `t` (`a`,`b`) VALUES (...),(...);` ; null si elle ne suit pas exactement ce format. */
export function lireInsertion(ligne: string): Insertion | null {
  const lecteur = new Lecteur(ligne);
  if (!lecteur.lire("INSERT INTO ")) return null;
  const table = lecteur.nomEntreAccents();
  if (!table || !lecteur.lire(" ")) return null;
  const colonnes = lecteur.liste(() => lecteur.nomEntreAccents() ?? undefined);
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
