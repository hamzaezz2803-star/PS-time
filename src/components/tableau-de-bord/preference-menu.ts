/**
 * Préférence « menu replié », gardée dans le navigateur (confort seulement).
 * À lire avec useSyncExternalStore : le serveur, lui, affiche toujours le menu déplié.
 */
const CLE = "ps-time:menu-replie";
const abonnes = new Set<() => void>();

export function abonnerPreferenceMenu(rappel: () => void) {
  abonnes.add(rappel);
  window.addEventListener("storage", rappel); // synchronise les autres onglets
  return () => {
    abonnes.delete(rappel);
    window.removeEventListener("storage", rappel);
  };
}

export function lirePreferenceMenu(): boolean {
  try {
    return localStorage.getItem(CLE) === "1";
  } catch {
    return false; // stockage indisponible (navigation privée) : menu déplié
  }
}

export const lirePreferenceMenuServeur = () => false;

export function enregistrerPreferenceMenu(estReplie: boolean) {
  try {
    localStorage.setItem(CLE, estReplie ? "1" : "0");
  } catch {
    // Stockage bloqué : la préférence ne sera simplement pas retenue.
  }
  abonnes.forEach((rappel) => rappel());
}
