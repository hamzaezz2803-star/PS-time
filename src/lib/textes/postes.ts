/** Textes de la gestion des postes. */
export const TEXTES_POSTES = {
  titrePage: "Postes",
  sousTitre:
    "Définissez les postes de l'entreprise et leur hiérarchie. Cliquez sur un poste pour le modifier.",
  chargement: "Chargement des postes...",
  arbre: {
    titre: "Hiérarchie des postes",
    toutDeplier: "Tout déplier",
    toutReplier: "Tout replier",
    deplier: (nom: string) => `Déplier ${nom}`,
    replier: (nom: string) => `Replier ${nom}`,
    vide: "Aucun poste pour l'instant.",
    videAction: "Créez le premier avec « Nouveau poste ».",
    nouveau: "Nouveau poste",
    modifier: (nom: string) => `Modifier ${nom}`,
    supprimer: (nom: string) => `Supprimer ${nom}`,
    fermer: "Fermer",
    employes: (nombre: number) =>
      nombre === 0
        ? "Aucun employé n'occupe ce poste"
        : nombre === 1
          ? "1 employé occupe ce poste"
          : `${nombre} employés occupent ce poste`,
    total: (nombre: number) => (nombre <= 1 ? `${nombre} poste` : `${nombre} postes`),
  },
  formulaire: {
    titreCreation: "Nouveau poste",
    titreModification: (nom: string) => `Modifier « ${nom} »`,
    code: "Numéro de poste",
    exempleCode: "Par exemple : OP-01",
    aideCode: "Unique dans l'entreprise. Lettres, chiffres, tirets, points ou soulignés.",
    nom: "Nom du poste",
    exempleNom: "Par exemple : Opérateur de tri",
    ordre: "Ordre d'affichage",
    aideOrdre: (minimum: number, maximum: number) =>
      `De ${minimum} à ${maximum}. Le plus petit apparaît en premier ; ${maximum} place le poste en fin de liste.`,
    parent: "Poste parent",
    aucunParent: "Aucun (poste principal)",
    enregistrer: "Enregistrer",
    enregistrementEnCours: "Enregistrement...",
    confirmerSuppression: (nom: string) => `Supprimer définitivement « ${nom} » ?`,
    titreSuppression: "Supprimer le poste",
    explicationSuppression: "Les employés qui occupent ce poste n'auront plus de poste. Cette action ne peut pas être annulée.",
    oui: "Supprimer définitivement",
    annuler: "Annuler",
    cree: "Poste créé.",
    modifie: "Modifications enregistrées.",
    supprime: "Poste supprimé.",
  },
  erreurs: {
    codeVide: "Saisissez le numéro du poste.",
    codeTropLong: "Ce numéro est trop long (30 caractères maximum).",
    codeInvalide: "Utilisez seulement des lettres, des chiffres, des tirets, des points ou des soulignés, sans espace.",
    codeDejaPris: "Ce numéro est déjà utilisé par un autre poste.",
    nomVide: "Saisissez le nom du poste.",
    nomTropLong: "Ce nom est trop long (100 caractères maximum).",
    nomDejaPris: "Un poste portant ce nom existe déjà à cet endroit.",
    ordreInvalide: (minimum: number, maximum: number) =>
      `Saisissez un nombre entier entre ${minimum} et ${maximum}.`,
    parentIntrouvable: "Le poste parent choisi n'existe plus.",
    boucle: "Un poste ne peut pas être placé sous un de ses postes rattachés.",
    introuvable: "Ce poste n'existe plus. La liste a été actualisée.",
    aDesEnfants:
      "Des postes sont rattachés à celui-ci. Déplacez-les ou supprimez-les d'abord.",
    droits: "Vous n'avez pas les droits pour modifier les postes.",
    echec: "L'opération a échoué. Réessayez dans un instant.",
  },
} as const;
