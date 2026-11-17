/**
 * Découpage d'une formule en éléments (nombres, noms, opérateurs, parenthèses, virgules).
 * Les noms sont mis en majuscules : variables, fonctions et mots-clés ignorent la casse.
 */
import { echec } from "./erreurs.ts";

export type Jeton =
  | { type: "nombre"; valeur: number; position: number }
  | { type: "nom"; valeur: string; position: number }
  | { type: "operateur"; valeur: string; position: number }
  | { type: "parenthese_ouvrante" | "parenthese_fermante" | "virgule" | "fin"; position: number };

/** Opérateurs reconnus, les plus longs d'abord ; « == » et « <> » sont des synonymes. */
const OPERATEURS = [">=", "<=", "==", "!=", "<>", "+", "-", "*", "/", ">", "<", "="];
const SYNONYMES: Record<string, string> = { "==": "=", "<>": "!=" };

const estChiffre = (caractere: string) => caractere >= "0" && caractere <= "9";
const estDebutNom = (caractere: string) => /[A-Za-z_]/.test(caractere);
const estSuiteNom = (caractere: string) => /[A-Za-z0-9_]/.test(caractere);

/** Lit un nombre (« 12 », « 0.5 », « .5 ») à partir de `debut` ; renvoie le jeton et la position suivante. */
function lireNombre(formule: string, debut: number): [Jeton, number] {
  let fin = debut;
  while (fin < formule.length && (estChiffre(formule[fin]) || formule[fin] === ".")) fin += 1;
  const texte = formule.slice(debut, fin);
  if (!/^(\d+(\.\d+)?|\.\d+)$/.test(texte) || estSuiteNom(formule[fin] ?? " ")) echec("NOMBRE_INVALIDE", debut, texte);
  return [{ type: "nombre", valeur: Number(texte), position: debut }, fin];
}

function lireNom(formule: string, debut: number): [Jeton, number] {
  let fin = debut;
  while (fin < formule.length && estSuiteNom(formule[fin])) fin += 1;
  return [{ type: "nom", valeur: formule.slice(debut, fin).toUpperCase(), position: debut }, fin];
}

const SIGNES: Record<string, "parenthese_ouvrante" | "parenthese_fermante" | "virgule"> = {
  "(": "parenthese_ouvrante",
  ")": "parenthese_fermante",
  ",": "virgule",
};

/** Découpe toute la formule ; le dernier jeton est toujours « fin ». */
export function decouper(formule: string): Jeton[] {
  const jetons: Jeton[] = [];
  let position = 0;
  while (position < formule.length) {
    const caractere = formule[position];
    if (/\s/.test(caractere)) {
      position += 1;
    } else if (estChiffre(caractere) || (caractere === "." && estChiffre(formule[position + 1] ?? ""))) {
      const [jeton, suivante] = lireNombre(formule, position);
      jetons.push(jeton);
      position = suivante;
    } else if (estDebutNom(caractere)) {
      const [jeton, suivante] = lireNom(formule, position);
      jetons.push(jeton);
      position = suivante;
    } else if (SIGNES[caractere]) {
      jetons.push({ type: SIGNES[caractere], position });
      position += 1;
    } else {
      const operateur = OPERATEURS.find((candidat) => formule.startsWith(candidat, position));
      if (!operateur) echec("CARACTERE_INVALIDE", position, caractere);
      jetons.push({ type: "operateur", valeur: SYNONYMES[operateur] ?? operateur, position });
      position += operateur.length;
    }
  }
  jetons.push({ type: "fin", position: formule.length });
  return jetons;
}
