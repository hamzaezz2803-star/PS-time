/** Règles propres aux postes. Fonctions pures, testées dans postes.test.ts. */
import { comparerParNom } from "./arbre.ts";

type PosteTriable = { nom: string; ordre: number };
type PosteAvecCode = { id: string; code: string };

/** Ordre d'affichage croissant, puis ordre alphabétique pour départager. */
export function comparerPostes(a: PosteTriable, b: PosteTriable): number {
  return a.ordre - b.ordre || comparerParNom(a, b);
}

/** Vrai si un autre poste porte déjà ce numéro (casse et espaces ignorés). */
export function codeDejaPris(liste: PosteAvecCode[], code: string, idIgnore?: string): boolean {
  const codeNormalise = code.trim().toLocaleLowerCase("fr");
  return liste.some(
    (poste) => poste.id !== idIgnore && poste.code.trim().toLocaleLowerCase("fr") === codeNormalise,
  );
}
