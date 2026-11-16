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
    identifiant: {
      libelle: "Identifiant",
      exemple: "Par exemple : y.alaoui",
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
    identifiantVide: "Saisissez votre identifiant.",
    identifiantTropLong: "Cet identifiant est trop long.",
    motDePasseVide: "Saisissez votre mot de passe.",
    motDePasseTropLong: "Ce mot de passe est trop long.",
    identifiantsInvalides: "Identifiant ou mot de passe incorrect.",
    compteDesactive:
      "Ce compte est désactivé. Contactez l'administrateur de votre entreprise.",
    tropDeTentatives:
      "Trop de tentatives de connexion. Patientez une minute avant de réessayer.",
    serviceIndisponible:
      "La connexion a échoué. Vérifiez votre réseau puis réessayez.",
  },
  /** Fenêtre de création du premier compte, ouverte après la connexion « pstime ». */
  installation: {
    titre: "Créer le compte administrateur",
    explication:
      "Première installation : choisissez l'identifiant et le mot de passe du compte administrateur. Vous vous connecterez ensuite avec ce compte.",
    identifiant: "Identifiant",
    exempleIdentifiant: "Par exemple : admin",
    aideIdentifiant: (minimum: number, maximum: number) =>
      `De ${minimum} à ${maximum} caractères : lettres minuscules sans accent, chiffres, point, tiret ou tiret bas.`,
    nouveau: "Nouveau mot de passe",
    aideNouveau: (minimum: number) => `Au moins ${minimum} caractères.`,
    confirmation: "Confirmer le mot de passe",
    enregistrer: "Créer le compte",
    enregistrementEnCours: "Création...",
    annuler: "Annuler",
    fermer: "Fermer",
    reussite: "Compte administrateur créé. Connectez-vous avec votre nouvel identifiant et votre nouveau mot de passe.",
    erreurs: {
      identifiantInvalide: (minimum: number, maximum: number) =>
        `Saisissez de ${minimum} à ${maximum} caractères : lettres minuscules sans accent, chiffres, point, tiret ou tiret bas.`,
      identifiantReserve: "Cet identifiant est réservé à l'installation. Choisissez-en un autre.",
      nouveauTropCourt: (minimum: number) => `Le mot de passe doit contenir au moins ${minimum} caractères.`,
      nouveauTropLong: "Ce mot de passe est trop long.",
      confirmationDifferente: "Les deux mots de passe ne sont pas identiques.",
      expire:
        "Cette fenêtre a expiré ou le compte a déjà été créé. Reconnectez-vous avec « pstime » et le mot de passe du jour.",
      echec: "La création a échoué. Réessayez dans un instant.",
    },
  },
} as const;
