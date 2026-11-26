/** Textes du calendrier de choix d'une date (composant commun `components/ui/champ-calendrier.tsx`). */
export const TEXTES_CALENDRIER = {
  choisir: "Choisir une date",
  ouvrir: (libelle: string, date: string) => `${libelle} : ${date}. Ouvrir le calendrier`,
  ouvrirVide: (libelle: string) => `${libelle} : aucune date. Ouvrir le calendrier`,
  fenetre: "Calendrier",
  moisPrecedent: "Mois précédent",
  moisSuivant: "Mois suivant",
  joursSemaine: ["lu", "ma", "me", "je", "ve", "sa", "di"],
  joursSemaineLongs: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
  aujourdhui: "Aujourd'hui",
  effacer: "Effacer",
  aide: "Flèches pour changer de jour, Page précédente et suivante pour changer de mois, Entrée pour choisir, Échap pour fermer.",
} as const;
