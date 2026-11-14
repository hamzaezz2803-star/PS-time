/** Règles propres aux employés. Fonctions pures, testées dans employes.test.ts. */
import { INDICATIF_PAYS, LONGUEUR_MAX_VALEUR_CHAMP } from "../constantes.ts";

const FORMAT_E164 = /^\+[1-9]\d{7,14}$/;
const LONGUEUR_NUMERO_NATIONAL = 10; // 06 12 34 56 78

/**
 * Met un numéro au format international E.164 : « 06 12 34 56 78 » donne
 * « +212612345678 ». Renvoie null si le numéro n'est pas reconnu.
 */
export function normaliserTelephone(saisie: string): string | null {
  let numero = saisie.replace(/[\s.()-]/g, "");
  if (numero.startsWith("00")) numero = `+${numero.slice(2)}`;
  if (/^0\d+$/.test(numero) && numero.length === LONGUEUR_NUMERO_NATIONAL) {
    numero = `+${INDICATIF_PAYS}${numero.slice(1)}`;
  }
  return FORMAT_E164.test(numero) ? numero : null;
}

/** Affichage lisible d'un numéro marocain (« 06 12 34 56 78 ») ; les autres restent tels quels. */
export function formaterTelephone(telephone: string): string {
  const prefixe = `+${INDICATIF_PAYS}`;
  if (!telephone.startsWith(prefixe) || telephone.length !== prefixe.length + 9) {
    return telephone;
  }
  const national = `0${telephone.slice(prefixe.length)}`;
  return national.match(/\d{2}/g)?.join(" ") ?? telephone;
}

/** Vrai pour une date réelle au format AAAA-MM-JJ (le 2026-02-30 est refusé). */
export function estDateValide(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const date = new Date(`${valeur}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(valeur);
}

/** La fin d'emploi ne peut pas précéder l'embauche (vrai si l'une des deux manque). */
export function datesEmploiCoherentes(embauche: string | null, fin: string | null): boolean {
  return !embauche || !fin || fin >= embauche;
}

export type ErreurValeurChamp = "tropLong" | "nombre" | "date";
type ResultatValeurChamp =
  | { ok: true; valeur: string | null }
  | { ok: false; erreur: ErreurValeurChamp };

/** Valide la valeur d'un champ facultatif selon son type. Une saisie vide donne null. */
export function validerValeurChamp(
  type: "texte" | "nombre" | "date",
  saisie: string,
): ResultatValeurChamp {
  const valeur = saisie.trim();
  if (valeur === "") return { ok: true, valeur: null };
  if (valeur.length > LONGUEUR_MAX_VALEUR_CHAMP) return { ok: false, erreur: "tropLong" };

  if (type === "nombre") {
    const nombre = valeur.replace(",", ".");
    return /^-?\d+(\.\d+)?$/.test(nombre)
      ? { ok: true, valeur: nombre }
      : { ok: false, erreur: "nombre" };
  }
  if (type === "date") {
    return estDateValide(valeur) ? { ok: true, valeur } : { ok: false, erreur: "date" };
  }
  return { ok: true, valeur };
}

