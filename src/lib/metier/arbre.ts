/**
 * Règles des arbres parent/enfants (départements, postes...). Fonctions pures,
 * sans base ni interface, testées dans arbre.test.ts.
 */

export type ElementArbre = {
  id: string;
  nom: string;
  parentId: string | null;
};

export type Noeud<T extends ElementArbre> = T & { enfants: Noeud<T>[] };

export type Comparateur<T> = (a: T, b: T) => number;

/** Ordre alphabétique français, sans tenir compte de la casse ni des accents. */
export const comparerParNom: Comparateur<{ nom: string }> = (a, b) =>
  a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });

/** Construit l'arbre trié. Un élément dont le parent n'existe plus est placé à la racine. */
export function construireArbre<T extends ElementArbre>(
  liste: T[],
  comparer: Comparateur<T> = comparerParNom,
): Noeud<T>[] {
  const noeuds = new Map<string, Noeud<T>>(
    liste.map((element) => [element.id, { ...element, enfants: [] }]),
  );
  const racines: Noeud<T>[] = [];

  for (const noeud of noeuds.values()) {
    const parent = noeud.parentId ? noeuds.get(noeud.parentId) : undefined;
    (parent ? parent.enfants : racines).push(noeud);
  }

  const trier = (niveau: Noeud<T>[]) => {
    niveau.sort(comparer);
    niveau.forEach((noeud) => trier(noeud.enfants));
  };
  trier(racines);
  return racines;
}

/** Identifiants de tous les descendants (à tous les niveaux) d'un élément. */
export function idsDescendants(liste: ElementArbre[], id: string): Set<string> {
  const descendants = new Set<string>();
  const aVisiter = [id];
  while (aVisiter.length > 0) {
    const courant = aVisiter.pop();
    for (const element of liste) {
      if (element.parentId === courant && !descendants.has(element.id)) {
        descendants.add(element.id);
        aVisiter.push(element.id);
      }
    }
  }
  return descendants;
}

/** Identifiants des parents d'un élément, du plus proche au plus lointain. */
export function idsAncetres(liste: ElementArbre[], id: string): string[] {
  const parId = new Map(liste.map((element) => [element.id, element]));
  const ancetres: string[] = [];
  let parentId = parId.get(id)?.parentId ?? null;
  // La garde contre les boucles protège d'une donnée incohérente saisie hors de l'application.
  while (parentId && !ancetres.includes(parentId)) {
    ancetres.push(parentId);
    parentId = parId.get(parentId)?.parentId ?? null;
  }
  return ancetres;
}

/** Un élément ne peut être placé ni sous lui-même ni sous un de ses descendants. */
export function peutDeplacer(
  liste: ElementArbre[],
  id: string,
  nouveauParentId: string | null,
): boolean {
  if (nouveauParentId === null) return true;
  if (nouveauParentId === id) return false;
  return !idsDescendants(liste, id).has(nouveauParentId);
}

/** Vrai si un autre élément du même parent porte déjà ce nom (casse et espaces ignorés). */
export function nomDejaPris(
  liste: ElementArbre[],
  nom: string,
  parentId: string | null,
  idIgnore?: string,
): boolean {
  const nomNormalise = nom.trim();
  return liste.some(
    (element) =>
      element.id !== idIgnore &&
      element.parentId === parentId &&
      comparerParNom(element, { nom: nomNormalise }) === 0,
  );
}

/** Liste à plat dans l'ordre de l'arbre, avec la profondeur (pour un menu déroulant indenté). */
export function aplatirArbre<T extends ElementArbre>(
  arbre: Noeud<T>[],
  profondeur = 0,
): Array<T & { profondeur: number }> {
  return arbre.flatMap(({ enfants, ...element }) => [
    { ...(element as unknown as T), profondeur },
    ...aplatirArbre(enfants, profondeur + 1),
  ]);
}

/** Somme d'un compteur pour un élément et tous ses descendants (ex. employés d'un département et de ses sous-départements). */
export function totalAvecDescendants(
  liste: ElementArbre[],
  id: string,
  compteurs: Record<string, number>,
): number {
  let total = compteurs[id] ?? 0;
  for (const descendant of idsDescendants(liste, id)) total += compteurs[descendant] ?? 0;
  return total;
}
