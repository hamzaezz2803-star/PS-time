/**
 * Limite de tentatives par clé (adresse IP, ou une clé commune à tous) sur une fenêtre fixe.
 * Compteur en mémoire : une installation = un seul serveur (voir README-projet, exceptions).
 */
export function creerLimiteur(maximum: number, fenetreMillisecondes: number) {
  const compteurs = new Map<string, { debut: number; nombre: number }>();

  return {
    /** Compte une tentative ; renvoie false si la limite est déjà atteinte sur la fenêtre en cours. */
    autoriser(cle: string, maintenant: number): boolean {
      const compteur = compteurs.get(cle);
      if (!compteur || maintenant - compteur.debut >= fenetreMillisecondes) {
        compteurs.set(cle, { debut: maintenant, nombre: 1 });
        return true;
      }
      if (compteur.nombre >= maximum) return false;
      compteur.nombre += 1;
      return true;
    },
  };
}
