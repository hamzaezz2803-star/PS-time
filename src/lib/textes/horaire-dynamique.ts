/** Textes de la page Planning > Horaire dynamique (règles et employés concernés). */
import { TEXTES_PROGRAMME } from "./programme";

const { commun } = TEXTES_PROGRAMME;

export const TEXTES_HORAIRE_DYNAMIQUE = {
  ...commun,
  titrePage: "Horaire dynamique",
  chargement: "Chargement de l'horaire dynamique...",
  onglets: { libelle: "Sections de l'horaire dynamique", regles: "Règles", employes: "Employés concernés" },

  // Règles
  titre: "Règles de reconnaissance",
  total: (n: number) => (n <= 1 ? `${n} règle` : `${n} règles`),
  nouveau: "Nouvelle règle",
  vide: "Aucune règle pour l'instant.",
  videAction: "Ajoutez une règle : « premier pointage entre 06:00 et 09:00, du lundi au vendredi → Journée 8 h ».",
  titreCreation: "Nouvelle règle",
  titreModification: () => "Modifier la règle",
  titreSuppression: "Supprimer la règle",
  explicationSuppression: "Les jours déjà passés ne sont pas recalculés : seul l'affichage des résultats change. Cette action ne peut pas être annulée.",
  nomRegle: (debut: string, fin: string, profil: string) => `De ${debut} à ${fin} : ${profil}`,
  colonnes: { fenetre: "Premier pointage", profil: "Profil horaire", jours: "Jours", etat: "État" },
  fenetre: (debut: string, fin: string) => `${debut} à ${fin}`,
  joursCourts: ["L", "M", "M", "J", "V", "S", "D"],
  joursLongs: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
  joursActifs: (noms: string[]) => `Jours : ${noms.join(", ")}`,
  actif: "Active",
  inactif: "Inactive",
  activer: "Activer la règle",
  desactiver: "Désactiver la règle",
  manqueProfil: "Créez d'abord au moins un profil horaire de type Travail.",

  // Formulaire
  heureDebut: "Premier pointage à partir de",
  heureFin: "Jusqu'à (exclu)",
  profil: "Profil horaire appliqué",
  choisirProfil: "Choisir un profil",
  jours: "Jours concernés",
  tousLesJours: "Tous",
  joursOuvres: "Lun. à ven.",
  estActif: "Règle active",
  couleur: "Couleur dans le rapport des présences",
  apercu: "Aperçu",
  couleurChoisie: (nom: string) => `Couleur choisie : ${nom}`,
  nomsCouleurs: {
    bleu: "Bleu",
    vert: "Vert",
    orange: "Orange",
    rouge: "Rouge",
    turquoise: "Turquoise",
    rose: "Rose",
    jaune: "Jaune",
    ardoise: "Ardoise",
  },
  conflitClient: (nom: string) => `Chevauche la règle « ${nom} » (mêmes heures un même jour).`,
  cree: "Règle créée.",
  modifie: "Modifications enregistrées.",
  supprime: "Règle supprimée.",
  active: "Règle activée.",
  desactivee: "Règle désactivée.",

  // Employés
  titreEmployes: "Employés concernés",
  enregistrerEmployes: "Enregistrer la sélection",
  employesEnregistres: (n: number) =>
    n === 0 ? "Plus aucun employé n'utilise l'horaire dynamique." : n === 1 ? "1 employé utilise l'horaire dynamique." : `${n} employés utilisent l'horaire dynamique.`,
  rechercher: "Rechercher un employé",
  exempleRecherche: "Nom ou matricule",
  selectionnes: (n: number) => (n <= 1 ? `${n} sélectionné` : `${n} sélectionnés`),
  aucunEmploye: "Aucun employé pour l'instant. Ajoutez-en dans Personnel > Personnes.",
  aucunResultat: "Aucun employé ne correspond à cette recherche.",
  filtreDepartement: "Filtrer par département",
  tousDepartements: "Tous les départements",
  toutCocher: "Tout cocher (liste affichée)",
  toutDecocher: "Tout décocher",

  erreurs: {
    heureInvalide: "Saisissez une heure valide (HH:MM).",
    couleurInvalide: "Choisissez une couleur dans la liste.",
    fenetreInvalide: "L'heure de fin doit être après l'heure de début, le même jour.",
    profilVide: "Choisissez un profil horaire.",
    profilIntrouvable: "Ce profil n'existe plus ou n'est pas un profil de travail. Rechargez la page.",
    chevauchement: "Une autre règle active couvre déjà une partie de ces heures un même jour.",
    employesIntrouvables: "Un des employés choisis n'existe plus. Rechargez la page.",
  },
} as const;
