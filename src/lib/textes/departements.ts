/** Textes de la gestion des départements. */
export const TEXTES_DEPARTEMENTS = {
  titrePage: "Départements",
  sousTitre:
    "Organisez votre entreprise en départements et sous-départements. Sélectionnez un département pour le modifier.",
  chargement: "Chargement des départements...",
  arbre: {
    titre: "Organisation",
    toutDeplier: "Tout déplier",
    toutReplier: "Tout replier",
    deplier: (nom: string) => `Déplier ${nom}`,
    replier: (nom: string) => `Replier ${nom}`,
    vide: "Aucun département pour l'instant.",
    videAction: "Créez le premier avec le formulaire.",
    nouveau: "Nouveau département",
    sousDepartements: (nombre: number) =>
      nombre === 1 ? "1 sous-département" : `${nombre} sous-départements`,
  },
  formulaire: {
    titreCreation: "Nouveau département",
    titreModification: "Modifier le département",
    nom: "Nom du département",
    exempleNom: "Par exemple : Logistique",
    parent: "Département parent",
    aucunParent: "Aucun (département principal)",
    enregistrer: "Enregistrer",
    enregistrementEnCours: "Enregistrement...",
    supprimer: "Supprimer",
    confirmerSuppression: (nom: string) =>
      `Supprimer définitivement « ${nom} » ?`,
    oui: "Oui, supprimer",
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
    echec: "L'opération a échoué. Réessayez dans un instant.",
  },
} as const;
