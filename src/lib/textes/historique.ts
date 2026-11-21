/** Textes de la page Administration > Historique (traçabilité, réservée au super administrateur). */
import type { ActionHistorique, ModuleHistorique } from "@/lib/metier/historique";
import type { EntreeHistorique } from "@/types";
import { TEXTES_NOTIFICATIONS } from "./notifications";

/** Ce qui a été exporté, avec son article. */
const EXPORTS: Partial<Record<EntreeHistorique["objet"], string>> = {
  employe: "la liste des personnes",
  rapport_presences: "le rapport des présences",
  sauvegarde: "une sauvegarde des données",
};

export const TEXTES_HISTORIQUE = {
  titrePage: "Historique",
  sousTitre:
    "Toutes les actions de tous les comptes, super administrateurs compris : créations, modifications, suppressions, connexions et exports. Réservé au super administrateur.",
  chargement: "Chargement de l'historique...",
  droits: "L'historique est réservé au super administrateur.",
  echec: "Impossible de charger l'historique. Réessayez dans un instant.",
  actions: {
    creation: "Création",
    modification: "Modification",
    suppression: "Suppression",
    connexion: "Connexion",
    deconnexion: "Déconnexion",
    export: "Export",
  } satisfies Record<ActionHistorique, string>,
  actionsPluriel: {
    creation: "Créations",
    modification: "Modifications",
    suppression: "Suppressions",
    connexion: "Connexions",
    deconnexion: "Déconnexions",
    export: "Exports",
  } satisfies Record<ActionHistorique, string>,
  modules: {
    personnel: "Personnel",
    planning: "Planning",
    presence: "Présence",
    administration: "Administration",
  } satisfies Record<ModuleHistorique, string>,
  resume: {
    titre: "Résumé de la sélection",
    total: "Actions",
    filtrer: (action: string) => `Afficher seulement : ${action.toLocaleLowerCase("fr")}`,
  },
  filtres: {
    titre: "Filtres de l'historique",
    du: "Du",
    au: "Au",
    auteur: "Auteur",
    tousAuteurs: "Tous les comptes",
    module: "Module",
    tousModules: "Tous les modules",
    action: "Action",
    toutesActions: "Toutes les actions",
    recherche: "Recherche",
    exempleRecherche: "Nom, identifiant, élément...",
    rechercher: "Rechercher",
    reinitialiser: "Réinitialiser",
    periodeRapide: "Période :",
    aujourdhui: "Aujourd'hui",
    septJours: "7 derniers jours",
    trenteJours: "30 derniers jours",
    aideLimite: (jours: number, conservation: number) =>
      `Jusqu'à ${jours} jours par recherche. Les actions sont gardées ${conservation} jours.`,
  },
  liste: {
    titre: "Actions",
    total: (n: number) => (n <= 1 ? `${n} action` : `${n} actions`),
    plage: (debut: number, fin: number, total: number) => `${debut} à ${fin} sur ${total}`,
    aujourdhui: "Aujourd'hui",
    hier: "Hier",
    vide: "Aucune action pour ces filtres.",
    videAide: "Élargissez la période ou retirez un filtre.",
    ouvrir: "Ouvrir",
    ouvrirPage: (libelle: string) => `Ouvrir la page concernée : ${libelle}`,
    compteSupprime: "compte supprimé",
    precedente: "Précédente",
    suivante: "Suivante",
    pagination: "Pages de l'historique",
    page: (page: number, pages: number) => `Page ${page} sur ${pages}`,
  },
  installation: "Installation (pstime)",
  libelleExport: (format: "excel" | "pdf", lignes: number) => `${format === "excel" ? "Excel" : "PDF"} · ${lignes} ligne${lignes > 1 ? "s" : ""}`,
  /** Phrase d'une ligne : reprend celle des notifications, plus connexions et exports. */
  phrase: (entree: Pick<EntreeHistorique, "action" | "objet" | "libelle">, auteur: string): string => {
    const precision = entree.libelle ? ` (${entree.libelle})` : "";
    if (entree.action === "connexion") return `Connexion de ${auteur} à l'application`;
    if (entree.action === "deconnexion") return `Déconnexion de ${auteur}`;
    if (entree.action === "export") return `${auteur} a exporté ${EXPORTS[entree.objet] ?? "des données"}${precision}`;
    if (entree.objet === "sauvegarde") return `${auteur} a importé une sauvegarde des données${precision}`;
    if (entree.objet === "rapport_presences" || entree.objet === "session") return `${auteur} : ${entree.libelle ?? ""}`;
    return TEXTES_NOTIFICATIONS.phrase({ action: entree.action, objet: entree.objet, libelle: entree.libelle }, auteur);
  },
} as const;
