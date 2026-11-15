/** Texte comparable : minuscules et sans accents (« Équipe » et « equipe » se valent). */
export function normaliserRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** Vrai si `texte` contient la recherche (vide : tout correspond), sans tenir compte des accents ni de la casse. */
export function correspondARecherche(texte: string, recherche: string): boolean {
  return normaliserRecherche(texte).includes(normaliserRecherche(recherche));
}

/** Motif SQL LIKE « contient », où %, _ et \ saisis sont cherchés tels quels (pas comme jokers). */
export function motifContient(texte: string): string {
  return `%${texte.replace(/[\\%_]/g, (caractere) => `\\${caractere}`)}%`;
}

/** Paramètres d'URL non vides, dans l'ordre donné (« ?nom=x&page=2 »), ou chaîne vide. */
export function chaineRecherche(parametres: Record<string, string | number | null | undefined>): string {
  const recherche = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(parametres)) {
    if (valeur !== null && valeur !== undefined && String(valeur) !== "") recherche.set(cle, String(valeur));
  }
  const texte = recherche.toString();
  return texte ? `?${texte}` : "";
}
