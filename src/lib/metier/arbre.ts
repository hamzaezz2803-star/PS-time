/**
 * Règles de l'arbre des départements. Fonctions pures, sans base ni interface,
 * testées dans arbre-departements.test.ts.
 */

export type DepartementPlat = {
  id: string;
  nom: string;
  parentId: string | null;
};

export type NoeudDepartement = DepartementPlat & {
  enfants: NoeudDepartement[];
};

const comparerNoms = (a: { nom: string }, b: { nom: string }) =>
  a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });

/** Construit l'arbre trié par nom. Un département dont le parent n'existe plus est placé à la racine. */
export function construireArbre(liste: DepartementPlat[]): NoeudDepartement[] {
  const noeuds = new Map<string, NoeudDepartement>(
    liste.map((departement) => [departement.id, { ...departement, enfants: [] }]),
  );
  const racines: NoeudDepartement[] = [];

  for (const noeud of noeuds.values()) {
    const parent = noeud.parentId ? noeuds.get(noeud.parentId) : undefined;
    (parent ? parent.enfants : racines).push(noeud);
  }

  const trier = (niveau: NoeudDepartement[]) => {
    niveau.sort(comparerNoms);
    niveau.forEach((noeud) => trier(noeud.enfants));
  };
  trier(racines);
  return racines;
}

/** Identifiants de tous les sous-départements (à tous les niveaux) d'un département. */
export function idsDescendants(liste: DepartementPlat[], id: string): Set<string> {
  const descendants = new Set<string>();
  const aVisiter = [id];
  while (aVisiter.length > 0) {
    const courant = aVisiter.pop();
    for (const departement of liste) {
      if (departement.parentId === courant && !descendants.has(departement.id)) {
        descendants.add(departement.id);
        aVisiter.push(departement.id);
      }
    }
  }
  return descendants;
}

/** Identifiants des départements parents d'un département, du plus proche au plus lointain. */
export function idsAncetres(liste: DepartementPlat[], id: string): string[] {
  const parParId = new Map(liste.map((departement) => [departement.id, departement]));
  const ancetres: string[] = [];
  let parentId = parParId.get(id)?.parentId ?? null;
  // La garde contre les boucles protège d'une donnée incohérente saisie hors de l'application.
  while (parentId && !ancetres.includes(parentId)) {
    ancetres.push(parentId);
    parentId = parParId.get(parentId)?.parentId ?? null;
  }
  return ancetres;
}

/** Un département ne peut être placé ni sous lui-même ni sous un de ses sous-départements. */
export function peutDeplacer(
  liste: DepartementPlat[],
  id: string,
  nouveauParentId: string | null,
): boolean {
  if (nouveauParentId === null) return true;
  if (nouveauParentId === id) return false;
  return !idsDescendants(liste, id).has(nouveauParentId);
}

/** Vrai si un autre département du même parent porte déjà ce nom (casse et espaces ignorés). */
export function nomDejaPris(
  liste: DepartementPlat[],
  nom: string,
  parentId: string | null,
  idIgnore?: string,
): boolean {
  const nomNormalise = nom.trim();
  return liste.some(
    (departement) =>
      departement.id !== idIgnore &&
      departement.parentId === parentId &&
      comparerNoms(departement, { nom: nomNormalise }) === 0,
  );
}

/** Liste à plat dans l'ordre de l'arbre, avec la profondeur (pour un menu déroulant indenté). */
export function aplatirArbre(
  arbre: NoeudDepartement[],
  profondeur = 0,
): Array<DepartementPlat & { profondeur: number }> {
  return arbre.flatMap(({ enfants, ...departement }) => [
    { ...departement, profondeur },
    ...aplatirArbre(enfants, profondeur + 1),
  ]);
}
