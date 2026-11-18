/** Textes de l'écran Présence > Compteurs > Détail jour. */

export const TEXTES_DETAIL_JOUR = {
  titrePage: "Détail jour",
  sousTitre: "Pour un employé et une date : son horaire, ses pointages et ses compteurs du jour, de la semaine et du mois.",
  chargement: "Chargement du détail...",
  droits: "Votre compte n'a pas accès à cette page. Demandez-la au super administrateur.",
  echec: "Le détail n'a pas pu être chargé. Réessayez dans un instant.",
  miseAJour: "Mise à jour du détail...",

  selection: {
    libelle: "Choix de l'employé et de la date",
    departement: "Département",
    tousDepartements: "Tous les départements",
    recherche: "Rechercher",
    exempleRecherche: "Nom ou matricule",
    employe: "Employé",
    choisirEmploye: "Choisir un employé",
    aucunEmploye: "Aucun employé ne correspond",
    date: "Date",
    jourPrecedent: "Jour précédent",
    jourSuivant: "Jour suivant",
    aujourdhui: "Aujourd'hui",
  },

  vide: {
    titre: "Choisissez un employé",
    detail: "Sélectionnez un employé et une date pour voir son horaire, ses pointages et ses compteurs.",
  },
  erreurs: {
    date: "Cette date n'est pas valide. Choisissez une autre date.",
    futur: "Cette date est dans le futur : il n'y a encore rien à calculer.",
    employe: "Cet employé n'existe plus. Choisissez-en un autre.",
  },

  horaire: {
    titre: "Horaire du jour",
    aucun: "Aucun horaire de travail prévu ce jour-là (repos, ou pas d'affectation).",
    dynamique: "Horaire dynamique",
    rotation: "Rotation",
    prevu: "Prévu",
    duree: "Durée prévue",
    entree: "Entrée réelle",
    sortie: "Sortie réelle",
    manquant: "Manquante",
    plage: (debut: string, fin: string) => `${debut} à ${fin}`,
  },

  pointages: {
    titre: "Pointages",
    total: (n: number) => (n <= 1 ? `${n} pointage` : `${n} pointages`),
    aucun: "Aucun pointage ce jour-là.",
    manuel: "Saisi à la main",
  },

  compteurs: {
    titre: "Compteurs",
    aucun: "Aucun compteur actif.",
    aucunAction: "Créez vos compteurs dans Gestion des compteurs.",
    lienGestion: "Gérer les compteurs",
    periodes: { JOUR: "Jour", SEMAINE: "Semaine", MOIS: "Mois" },
    periode: (debut: string, fin: string) => `du ${debut} au ${fin}`,
    jusquA: (date: string) => `jours écoulés jusqu'au ${date}`,
    aucunPourPeriode: "Aucun compteur pour cette période.",
    nonCalculable: "Non calculable",
    egalVeille: "Comme la veille",
    ecartVeille: (ecart: string, hausse: boolean) => `${hausse ? "+" : "−"}${ecart} par rapport à la veille`,
    tendance: (libelle: string) => `Tendance sur 7 jours de ${libelle}`,
    valeurJour: (jour: string, valeur: string) => `${jour} : ${valeur}`,
    sansValeur: "sans valeur",
    formule: "Formule",
  },

  historique: {
    titre: "Historique journalier",
    duree: "Durée affichée",
    jours: (n: number) => `${n} jours`,
    aucun: "Aucun compteur journalier actif : rien à afficher jour par jour.",
    colonneJour: "Jour",
    total: "Total (moyenne pour les %)",
    afficherJour: (jour: string) => `Afficher le ${jour}`,
    jourAffiche: "Jour affiché",
  },
} as const;
