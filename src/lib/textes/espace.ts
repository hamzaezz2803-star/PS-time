/** Textes de l'espace connecté et du changement de mot de passe. */
export const TEXTES_ESPACE = {
  titrePage: "Mon espace",
  chargement: "Chargement de votre espace...",
  bonjour: (nom: string) => `Bonjour ${nom}`,
  surtitre: "Tableau de bord",
  titreChiffres: "Vue d'ensemble",
  heureCasablanca: "Heure de Casablanca",
  aucunModule:
    "Aucune page ne vous est encore attribuée. Demandez au super administrateur de vous donner accès aux pages dont vous avez besoin.",
  voir: (libelle: string) => `Ouvrir ${libelle.toLocaleLowerCase("fr")}`,
  titrePlanning: "Mettre en place le planning",
  etape: (numero: number) => `Étape ${numero}`,
  deconnexion: "Se déconnecter",
  changerMotDePasse: "Changer mon mot de passe",
} as const;

export const TEXTES_MOT_DE_PASSE = {
  titrePage: "Changer le mot de passe",
  titre: "Choisissez un nouveau mot de passe",
  chargement: "Chargement...",
  champs: {
    actuel: "Mot de passe actuel",
    nouveau: "Nouveau mot de passe",
    confirmation: "Confirmer le nouveau mot de passe",
  },
  bouton: "Enregistrer le mot de passe",
  boutonEnCours: "Enregistrement...",
  erreurs: {
    actuelVide: "Saisissez votre mot de passe actuel.",
    nouveauTropCourt: (minimum: number) =>
      `Le nouveau mot de passe doit contenir au moins ${minimum} caractères.`,
    nouveauTropLong: "Ce mot de passe est trop long.",
    nouveauIdentique: "Le nouveau mot de passe doit être différent de l'actuel.",
    confirmationDifferente: "Les deux mots de passe ne correspondent pas.",
    actuelIncorrect: "Le mot de passe actuel est incorrect.",
    echec: "Le mot de passe n'a pas pu être changé. Réessayez dans un instant.",
  },
} as const;
