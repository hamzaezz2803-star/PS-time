/** Textes de l'espace connecté et du changement de mot de passe. */
export const TEXTES_ESPACE = {
  titrePage: "Mon espace",
  chargement: "Chargement de votre espace...",
  bonjour: (nom: string) => `Bonjour ${nom}`,
  surtitre: "Tableau de bord",
  introduction:
    "Retrouvez ici l'essentiel de votre organisation : personnel, structure et planning des équipes. Les écrans de pointage arrivent dans les prochaines étapes.",
  titreChiffres: "Vue d'ensemble",
  heureCasablanca: "Heure de Casablanca",
  aucunModule:
    "Aucune page ne vous est encore attribuée. Demandez au super administrateur de vous donner accès aux pages dont vous avez besoin.",
  voir: (libelle: string) => `Ouvrir ${libelle.toLocaleLowerCase("fr")}`,
  titrePlanning: "Mettre en place le planning",
  sousTitrePlanning: "Quatre étapes, dans cet ordre, pour organiser les horaires de vos équipes.",
  etape: (numero: number) => `Étape ${numero}`,
  etapes: {
    profilsHoraires: "La journée découpée en plages : fixe, variable, repas, interdite...",
    rotations: "Semaine type ou cycle : un profil horaire ou un repos pour chaque jour.",
    groupes: "Rassemblez les employés qui suivent le même planning.",
    affectations: "Attribuez une rotation à un groupe ou à un employé, sur une période.",
  },
  deconnexion: "Se déconnecter",
  changerMotDePasse: "Changer mon mot de passe",
} as const;

export const TEXTES_MOT_DE_PASSE = {
  titrePage: "Changer le mot de passe",
  titre: "Choisissez un nouveau mot de passe",
  obligatoire:
    "Votre mot de passe provisoire a été créé par le super administrateur. Choisissez le vôtre : vous vous reconnecterez ensuite avec ce nouveau mot de passe.",
  volontaire: "Saisissez votre mot de passe actuel puis le nouveau. Vous vous reconnecterez ensuite avec ce nouveau mot de passe.",
  chargement: "Chargement...",
  champs: {
    actuel: "Mot de passe actuel",
    nouveau: "Nouveau mot de passe",
    aideNouveau: (minimum: number) => `${minimum} caractères minimum.`,
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
