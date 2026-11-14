/** Textes de la gestion des départements. */
export const TEXTES_DEPARTEMENTS = {
  titrePage: "Départements",
  sousTitre:
    "Organisez votre entreprise en départements et sous-départements. Cliquez sur un département pour le modifier.",
  chargement: "Chargement des départements...",
  arbre: {
    titre: "Organisation",
    toutDeplier: "Tout déplier",
    toutReplier: "Tout replier",
    deplier: (nom: string) => `Déplier ${nom}`,
    replier: (nom: string) => `Replier ${nom}`,
    vide: "Aucun département pour l'instant.",
    videAction: "Créez le premier avec « Nouveau département ».",
    nouveau: "Nouveau département",
    modifier: (nom: string) => `Modifier ${nom}`,
    supprimer: (nom: string) => `Supprimer ${nom}`,
    fermer: "Fermer",
    employes: (nombre: number) =>
      nombre === 0
        ? "Aucun employé (sous-départements compris)"
        : nombre === 1
          ? "1 employé (sous-départements compris)"
          : `${nombre} employés (sous-départements compris)`,
    total: (nombre: number) => (nombre <= 1 ? `${nombre} département` : `${nombre} départements`),
  },
  formulaire: {
    titreCreation: "Nouveau département",
    titreModification: (nom: string) => `Modifier « ${nom} »`,
    nom: "Nom du département",
    exempleNom: "Par exemple : Logistique",
    parent: "Département parent",
    aucunParent: "Aucun (département principal)",
    enregistrer: "Enregistrer",
    enregistrementEnCours: "Enregistrement...",
    confirmerSuppression: (nom: string) =>
      `Supprimer définitivement « ${nom} » ?`,
    titreSuppression: "Supprimer le département",
    explicationSuppression: "Cette action ne peut pas être annulée.",
    oui: "Supprimer définitivement",
    annuler: "Annuler",
    cree: "Département créé.",
    modifie: "Modifications enregistrées.",
    supprime: "Département supprimé.",
  },
  erreurs: {
    nomVide: "Saisissez le nom du département.",
    nomTropLong: "Ce nom est trop long (100 caractères maximum).",
    nomDejaPris: "Un département portant ce nom existe déjà à cet endroit.",
    parentIntrouvable: "Le département parent choisi n'existe plus.",
    boucle: "Un département ne peut pas être placé dans un de ses sous-départements.",
    introuvable: "Ce département n'existe plus. La liste a été actualisée.",
    aDesEnfants:
      "Ce département contient des sous-départements. Déplacez-les ou supprimez-les d'abord.",
    droits: "Vous n'avez pas les droits pour modifier les départements.",
    aDesEmployes:
      "Des employés sont rattachés à ce département. Changez-les de département d'abord.",
    echec: "L'opération a échoué. Réessayez dans un instant.",
  },
} as const;
