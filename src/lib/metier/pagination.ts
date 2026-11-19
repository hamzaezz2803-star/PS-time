/** Pagination des listes lues dans l'URL. Fonction pure, testée dans pagination.test.ts. */

/** Numéro de page demandé (`?page=`), ramené entre 1 et le nombre de pages ; invalide : 1. */
export function lirePage(valeur: string | string[] | undefined, nombrePages: number): number {
  const page = Number.parseInt(typeof valeur === "string" ? valeur : "1", 10);
  return Number.isNaN(page) ? 1 : Math.min(Math.max(page, 1), nombrePages);
}
