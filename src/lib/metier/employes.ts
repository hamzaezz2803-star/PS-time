/** Règles propres aux employés. Fonctions pures, testées dans employes.test.ts. */
import {
  INDICATIF_PAYS,
  LIMITE_INFORMATIONS_EMPLOYE,
  LONGUEUR_MAX_LIBELLE_INFORMATION,
  LONGUEUR_MAX_VALEUR_INFORMATION,
} from "../constantes.ts";

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

export type Information = { libelle: string; valeur: string };
export type ErreurInformation =
  | "libelleVide"
  | "valeurVide"
  | "libelleTropLong"
  | "valeurTropLong"
  | "libelleEnDouble";

type ResultatInformations = {
  /** Lignes valides à enregistrer (les lignes entièrement vides sont ignorées). */
  informations: Information[];
  /** Erreurs par numéro de ligne (dans l'ordre de la saisie). */
  erreurs: Record<number, { libelle?: ErreurInformation; valeur?: ErreurInformation }>;
  estTropNombreuses: boolean;
};

const nettoyer = (texte: string) => texte.replace(/\s+/g, " ").trim();

/**
 * Valide les informations supplémentaires d'un employé : libellé et valeur obligatoires
 * ensemble, longueurs bornées, pas deux fois le même libellé (casse ignorée).
 */
export function validerInformations(lignes: Information[]): ResultatInformations {
  const informations: Information[] = [];
  const erreurs: ResultatInformations["erreurs"] = {};
  const libellesVus = new Set<string>();

  lignes.forEach((ligne, index) => {
    const libelle = nettoyer(ligne.libelle);
    const valeur = nettoyer(ligne.valeur);
    if (libelle === "" && valeur === "") return;

    const erreur: { libelle?: ErreurInformation; valeur?: ErreurInformation } = {};
    const cle = libelle.toLocaleLowerCase("fr");
    if (libelle === "") erreur.libelle = "libelleVide";
    else if (libelle.length > LONGUEUR_MAX_LIBELLE_INFORMATION) erreur.libelle = "libelleTropLong";
    else if (libellesVus.has(cle)) erreur.libelle = "libelleEnDouble";
    if (valeur === "") erreur.valeur = "valeurVide";
    else if (valeur.length > LONGUEUR_MAX_VALEUR_INFORMATION) erreur.valeur = "valeurTropLong";

    libellesVus.add(cle);
    if (erreur.libelle || erreur.valeur) erreurs[index] = erreur;
    else informations.push({ libelle, valeur });
  });

  return {
    informations,
    erreurs,
    estTropNombreuses: informations.length > LIMITE_INFORMATIONS_EMPLOYE,
  };
}
