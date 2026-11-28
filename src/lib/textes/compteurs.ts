/** Textes de la page Présence > Compteurs > Gestion des compteurs. */

export const TEXTES_COMPTEURS = {
  titrePage: "Gestion des compteurs",
  chargement: "Chargement des compteurs...",
  droits: "Votre compte n'a pas accès à cette page. Demandez-la au super administrateur.",
  echec: "L'opération a échoué. Réessayez dans un instant.",
  introuvable: "Ce compteur n'existe plus. La liste a été actualisée.",

  // Liste (composant commun)
  titre: "Compteurs",
  total: (n: number) => (n <= 1 ? `${n} compteur` : `${n} compteurs`),
  nouveau: "Nouveau compteur",
  vide: "Aucun compteur pour l'instant.",
  videAction: "Créez le premier, par exemple « Retard du jour » avec la formule RETARD_MIN.",
  aucunFiltre: "Aucun compteur ne correspond à ces filtres.",
  titreCreation: "Nouveau compteur",
  titreModification: (nom: string) => `Modifier « ${nom} »`,
  titreConsultation: (nom: string) => `Compteur standard « ${nom} »`,
  consulter: (nom: string) => `Voir ${nom}`,
  titreSuppression: "Supprimer le compteur",
  explicationSuppression:
    "Le compteur et tout l'historique de ses versions sont supprimés. Ses valeurs disparaissent des écrans (elles ne sont jamais enregistrées). Pour seulement arrêter de le calculer, désactivez-le plutôt. Cette action ne peut pas être annulée.",
  confirmerSuppression: (nom: string) => `Supprimer définitivement « ${nom} » ?`,
  oui: "Supprimer définitivement",
  modifier: (nom: string) => `Modifier ${nom}`,
  supprimer: (nom: string) => `Supprimer ${nom}`,
  supprime: "Compteur supprimé.",
  actions: "Actions",
  fermer: "Fermer",
  annuler: "Annuler",
  colonnes: { compteur: "Compteur", periodicites: "Périodicités", unite: "Unité", etat: "État" },
  filtres: { libelle: "Filtrer les compteurs", type: "Type", types: { tous: "Tous", standards: "Standards", personnalises: "Personnalisés" }, periodicite: "Périodicité", toutes: "Toutes", etat: "État", tous: "Tous", actifs: "Actifs", inactifs: "Inactifs" },
  actif: "Actif",
  inactif: "Inactif",
  activer: (nom: string) => `Activer ${nom}`,
  desactiver: (nom: string) => `Désactiver ${nom}`,
  active: "Compteur activé.",
  desactive: "Compteur désactivé. Il n'est plus calculé, son historique de versions est gardé.",

  // Formulaire
  sectionIdentite: "Identité",
  sectionFormule: "Formule",
  code: "Identifiant",
  libelle: "Libellé",
  exempleLibelle: "Par exemple : Retard du jour",
  periodicites: "Calculé pour",
  unite: "Unité du résultat",
  unites: { minutes: "Minutes (vues en h et min)", heures: "Heures", jours: "Jours", nombre: "Nombre", pourcentage: "Pourcentage" },
  unitesCourtes: { minutes: "Minutes", heures: "Heures", jours: "Jours", nombre: "Nombre", pourcentage: "%" },
  description: "Description (facultative)",
  estActif: "Compteur actif",
  formule: "Formule",
  exempleFormule: "Par exemple : IF(RETARD_MIN > 5, RETARD_MIN, 0)",
  formuleValide: "Formule valide",
  erreurPour: (periode: string, message: string) => `${periode} : ${message}`,
  choisirPeriodicite: "Cochez au moins une périodicité pour vérifier la formule.",
  versionChangera: "Formule, unité ou périodicités modifiées : une nouvelle version sera créée.",
  enregistrer: "Enregistrer",
  enregistrementEnCours: "Enregistrement...",
  cree: "Compteur créé.",
  modifie: "Modifications enregistrées.",
  modifieVersion: (version: number) => `Modifications enregistrées (version ${version}).`,

  // Aide
  aide: { titre: "Aide", variables: "Variables", fonctions: "Fonctions", operateurs: "Opérateurs", inserer: (nom: string) => `Insérer ${nom}`, indisponible: "Pas disponible pour les périodicités cochées" },

  // Test
  test: {
    titre: "Tester la formule",
    periodicite: "Variables de",
    aucuneVariable: "Cette formule n'utilise aucune variable.",
    resultat: "Résultat",
    formuleInvalide: "Corrigez d'abord la formule.",
  },

  // Versions
  versions: {
    titre: "Historique des versions",
    chargement: "Chargement des versions...",
    erreur: "Impossible de charger l'historique. Réessayez.",
    version: (numero: number) => `Version ${numero}`,
    actuelle: "Actuelle",
    par: (nom: string) => `par ${nom}`,
    auteurInconnu: "compte supprimé",
  },

  // Compteurs standards (livrés avec l'application, désactivés à l'installation, fixes)
  standard: {
    badge: "Standard",
    familles: { presence: "Présence et temps de travail", absences: "Absences", heures_sup: "Heures supplémentaires", conges: "Congés et RTT", autres: "Autres" },
    formule: "Formule",
    fonctionnement: "Fonctionnement",
    adaptation: "Calcul dans PS Time",
    remiseAZero: "Remise à zéro",
    aAdapter: "Formule à écrire",
    aCompleter: "Événement à créer",
    formuleIncomplete: (detail: string) => `Activation impossible : ${detail} Créez l'événement manquant (Présence > Gestion des exceptions > Événements).`,
    activationRefusee: "Ce compteur n'a pas encore de formule : il ne peut pas être activé.",
    modificationRefusee: "Un compteur standard ne se modifie pas. Créez votre propre compteur avec « Nouveau compteur ».",
    suppressionRefusee: "Un compteur standard ne se supprime pas. Désactivez-le s'il ne sert pas.",
  },

  erreurs: {
    codeInvalide: "Identifiant invalide : majuscules, chiffres, « _ » ou « - », 30 caractères au plus, sans espace.",
    codeDejaPris: "Un compteur utilise déjà cet identifiant.",
    libelleVide: "Saisissez le libellé.",
    libelleTropLong: "Ce libellé est trop long (100 caractères maximum).",
    libelleDejaPris: "Un compteur porte déjà ce libellé (majuscules et accents ne comptent pas).",
    periodicitesVides: "Cochez au moins une périodicité.",
    uniteInvalide: "Choisissez une unité.",
    descriptionTropLongue: "Cette description est trop longue (500 caractères maximum).",
  },
} as const;
