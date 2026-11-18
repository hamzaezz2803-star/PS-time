/** Aides des graphiques du tableau de bord. Fonctions pures, testées dans graphiques.test.ts. */

/** Pas « ronds » possibles pour un axe : 1, 2, 5, 10, 20, 50... */
const PAS_RONDS = [1, 2, 5];

/**
 * Graduations d'un axe de 0 à au moins `maximum`, avec un pas rond (entier : on compte des
 * personnes ou des heures) et au plus `nombreMax` intervalles. Un maximum nul donne [0, 1].
 */
export function graduations(maximum: number, nombreMax = 4): number[] {
  if (!(maximum > 0)) return [0, 1];
  const brut = maximum / nombreMax;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = Math.max(1, PAS_RONDS.map((facteur) => facteur * puissance).find((candidat) => candidat >= brut) ?? 10 * puissance);
  const nombre = Math.ceil(maximum / pas);
  return Array.from({ length: nombre + 1 }, (_, rang) => Math.round(rang * pas * 1e6) / 1e6);
}

/** Hauteur d'une valeur en % de l'axe (0 à 100). */
export const hauteurPourcent = (valeur: number, haut: number) => (haut > 0 ? Math.min(100, Math.max(0, (valeur / haut) * 100)) : 0);
