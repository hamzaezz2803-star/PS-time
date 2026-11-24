/** Textes du menu État (rapports sur les présences, événements, congés et pointages manuels). */
import type { Etat } from "@/lib/metier/etats";

export const TEXTES_ETATS = {
  chargement: "Chargement de l'état...",
  droits: "Votre compte n'a pas accès à cet état. Demandez-le au super administrateur.",
  echec: "L'état n'a pas pu être chargé. Réessayez dans un instant.",

  etats: {
    presences: {
      titre: "Présences et retards",
      sousTitre: "Jour par jour et pour chaque employé : horaire prévu, entrée, sortie, temps travaillé, retard et statut du jour.",
      vide: "Aucun employé attendu, pointé ni absent sur cette période.",
    },
    evenements: {
      titre: "Absences et événements",
      sousTitre: "Congés, maladies, formations... saisis pour les employés, avec les jours où ils sont validés (retenus) ou non.",
      vide: "Aucun événement saisi sur cette période.",
    },
    conges: {
      titre: "Congés et soldes",
      sousTitre: "Droits aux congés valables sur la période, avec le total, les jours pris, prévus et le solde prévisionnel.",
      vide: "Aucun droit aux congés sur cette période.",
    },
    "pointages-manuels": {
      titre: "Pointages manuels",
      sousTitre: "Pointages saisis à la main (oubli de badge, badgeuse en panne...), avec qui les a saisis.",
      vide: "Aucun pointage manuel sur cette période.",
    },
  } satisfies Record<Etat, { titre: string; sousTitre: string; vide: string }>,

  filtres: {
    titre: "Filtrer l'état",
    employe: "Employé",
    exempleEmploye: "Nom ou matricule",
  },

  tableau: {
    total: (n: number) => (n <= 1 ? `${n} ligne` : `${n} lignes`),
    ecranLimite: (affichees: number) => `Seules les ${affichees} premières lignes sont affichées ici. L'export Excel ou PDF contient tout.`,
    tropDeLignes: (maximum: number) => `L'état est limité à ${maximum} lignes. Réduisez la période ou filtrez par département.`,
    tropDEmployes: (maximum: number) => `Seuls les ${maximum} premiers employés sont pris en compte.`,
    videAction: "Élargissez la période ou changez de département.",
  },

  colonnes: {
    matricule: "Matricule",
    employe: "Employé",
    departement: "Département",
    date: "Date",
    heure: "Heure",
    horaire: "Horaire",
    entree: "Entrée",
    sortie: "Sortie",
    travaille: "Travaillé",
    retard: "Retard",
    statut: "Statut",
    evenement: "Événement",
    code: "Code",
    type: "Type",
    periode: "Période",
    joursPrevus: "Jours prévus",
    joursValides: "Jours validés",
    unite: "Unité",
    total: "Total",
    pris: "Pris",
    prevus: "Prévus",
    solde: "Solde prévisionnel",
    etatSolde: "État",
    etat: "État du pointage",
    remarque: "Remarque",
    saisiPar: "Saisi par",
  },

  valeurs: {
    repos: "Repos",
    statuts: { a_l_heure: "À l'heure", en_retard: "En retard", absent: "Absent", justifie: "Absence justifiée", attendu: "Pas encore arrivé", sans_horaire: "Sans horaire" },
    types: { absence: "Absence", presence: "Présence" },
    duAu: (du: string, au: string) => (du === au ? du : `Du ${du} au ${au}`),
    heures: (jour: string, debut: string, fin: string) => `${jour}, de ${debut} à ${fin}`,
    enHeures: "Saisie en heures",
    aConfirmer: "À confirmer",
    compteSupprime: "Compte supprimé",
  },

  document: {
    nomFichier: (etat: Etat, du: string, au: string) => `etat-${etat}-${du}-au-${au}`,
    retour: "Retour à l'état",
  },
} as const;
