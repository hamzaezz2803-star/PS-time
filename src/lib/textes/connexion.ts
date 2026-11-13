/** Textes de l'écran de connexion. */
export const TEXTES_CONNEXION = {
  titrePage: "Connexion",
  titre: "Connexion à PS Time",
  sousTitre: "Saisissez vos identifiants pour accéder à votre espace de pointage.",
  accroche: "Le pointage de vos équipes, simple et fiable.",
  phraseAppui:
    "Arrivées, pauses et heures travaillées, suivies au même endroit.",
  altLogo: "Logo PS Time",
  champs: {
    email: {
      libelle: "Adresse e-mail",
      exemple: "prenom.nom@entreprise.ma",
    },
    motDePasse: {
      libelle: "Mot de passe",
      afficher: "Afficher le mot de passe",
      masquer: "Masquer le mot de passe",
    },
  },
  boutonConnexion: "Se connecter",
  boutonConnexionEnCours: "Connexion en cours...",
  aide: "Un problème pour vous connecter ? Contactez l'administrateur de votre entreprise.",
  erreurs: {
    emailVide: "Saisissez votre adresse e-mail.",
    emailInvalide: "Saisissez une adresse e-mail valide, par exemple nom@entreprise.ma.",
    emailTropLong: "Cette adresse e-mail est trop longue.",
    motDePasseVide: "Saisissez votre mot de passe.",
    motDePasseTropLong: "Ce mot de passe est trop long.",
    identifiantsInvalides: "Adresse e-mail ou mot de passe incorrect.",
    compteDesactive:
      "Ce compte est désactivé. Contactez l'administrateur de votre entreprise.",
    tropDeTentatives:
      "Trop de tentatives de connexion. Patientez une minute avant de réessayer.",
    serviceIndisponible:
      "La connexion a échoué. Vérifiez votre réseau puis réessayez.",
  },
} as const;
