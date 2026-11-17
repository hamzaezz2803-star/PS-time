/**
 * Calcul des compteurs d'un employé pour une date : chaque compteur actif, pour chacune de ses
 * périodicités (jour, semaine, mois), sur les jours écoulés. Fonctions pures, testées dans calcul.test.ts.
 */
import { calculerFormule, compilerFormule, type ErreurFormule, type ResultatCompilation } from "../formules/formule.ts";
import type { Periode, Periodicite } from "./periodes.ts";
import { agregerJours, variablesDuJour, variablesPour, type JourService, type ValeursVariables } from "./variables.ts";

/** Ce qu'il faut d'un compteur pour le calculer. */
export type DefinitionCompteur = { id: string; version: number; formule: string; periodicites: readonly Periodicite[] };

export type ValeurCompteur = {
  idCompteur: string;
  periodicite: Periodicite;
  periode: { debut: string; fin: string; finCalcul: string };
  version: number;
} & ({ ok: true; valeur: number } | { ok: false; erreur: ErreurFormule });

const DECIMALES_CONSERVEES = 4;

/**
 * Formules déjà compilées, par compteur, version et périodicité : à garder d'un employé à
 * l'autre (une nouvelle version donne une nouvelle clé, l'ancienne n'est plus demandée).
 */
export type CacheFormules = Map<string, ResultatCompilation>;

function formuleCompilee(compteur: DefinitionCompteur, periodicite: Periodicite, cache: CacheFormules): ResultatCompilation {
  const cle = `${compteur.id}|${compteur.version}|${periodicite}`;
  let resultat = cache.get(cle);
  if (!resultat) {
    resultat = compilerFormule(compteur.formule, variablesPour(periodicite));
    cache.set(cle, resultat);
  }
  return resultat;
}

/** Variables de chaque période, à partir des journées de service chargées (jours hors période ignorés). */
export function variablesDesPeriodes(periodes: readonly Periode[], jours: readonly JourService[]): Map<Periodicite, ValeursVariables> {
  const parJour = new Map(jours.map((jour) => [jour.jour, variablesDuJour(jour)]));
  const resultat = new Map<Periodicite, ValeursVariables>();
  for (const periode of periodes) {
    const dansPeriode = [...parJour].filter(([jour]) => jour >= periode.debut && jour <= periode.finCalcul).map(([, valeurs]) => valeurs);
    resultat.set(periode.periodicite, periode.periodicite === "JOUR" ? (dansPeriode[0] ?? variablesDuJour({ jour: periode.debut, horaire: null, pointages: [] })) : agregerJours(dansPeriode));
  }
  return resultat;
}

const arrondir = (valeur: number) => Math.round(valeur * 10 ** DECIMALES_CONSERVEES) / 10 ** DECIMALES_CONSERVEES + 0;

/** Valeur de chaque compteur pour chacune de ses périodicités. Une erreur n'est jamais remplacée par 0. */
export function calculerCompteurs(
  compteurs: readonly DefinitionCompteur[],
  periodes: readonly Periode[],
  jours: readonly JourService[],
  cache: CacheFormules = new Map(),
): ValeurCompteur[] {
  const variables = variablesDesPeriodes(periodes, jours);
  return compteurs.flatMap((compteur) =>
    periodes
      .filter((periode) => compteur.periodicites.includes(periode.periodicite))
      .map((periode): ValeurCompteur => {
        const base = { idCompteur: compteur.id, periodicite: periode.periodicite, periode: { debut: periode.debut, fin: periode.fin, finCalcul: periode.finCalcul }, version: compteur.version };
        const compilation = formuleCompilee(compteur, periode.periodicite, cache);
        if (!compilation.ok) return { ...base, ok: false, erreur: compilation.erreur };
        const resultat = calculerFormule(compilation.formule, variables.get(periode.periodicite) ?? {});
        return resultat.ok ? { ...base, ok: true, valeur: arrondir(resultat.valeur) } : { ...base, ok: false, erreur: resultat.erreur };
      }),
  );
}

export type JourHistorique = { jour: string; valeurs: ValeurCompteur[] };

/**
 * Valeurs journalières des compteurs qui ont la périodicité « Jour », pour chaque journée
 * donnée (tendances et tableau d'historique). Les journées sont prises dans l'ordre reçu.
 */
export function historiqueJournalier(compteurs: readonly DefinitionCompteur[], jours: readonly JourService[], cache: CacheFormules = new Map()): JourHistorique[] {
  const journaliers = compteurs.filter((compteur) => compteur.periodicites.includes("JOUR"));
  return jours.map((jour) => ({
    jour: jour.jour,
    valeurs: calculerCompteurs(journaliers, [{ periodicite: "JOUR", debut: jour.jour, fin: jour.jour, finCalcul: jour.jour }], [jour], cache),
  }));
}
