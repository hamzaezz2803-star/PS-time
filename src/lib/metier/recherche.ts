/** Texte comparable : minuscules et sans accents (« Équipe » et « equipe » se valent). */
export function normaliserRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** Vrai si `texte` contient la recherche (vide : tout correspond), sans tenir compte des accents ni de la casse. */
export function correspondARecherche(texte: string, recherche: string): boolean {
  return normaliserRecherche(texte).includes(normaliserRecherche(recherche));
}
