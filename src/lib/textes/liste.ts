/** Textes communs aux listes (recherche, aucun résultat). */
export const TEXTES_LISTE = {
  rechercher: "Rechercher",
  exempleRecherche: "Rechercher par nom...",
  aucunResultat: (recherche: string) => `Aucun résultat pour « ${recherche} ».`,
  effacerRecherche: "Effacer la recherche",
} as const;
