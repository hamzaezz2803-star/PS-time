/**
 * Notifications : à quel module et à quelle page appartient chaque objet, et qui peut les voir.
 * Fonctions pures, testées dans notifications.test.ts.
 */
import { peutAcceder, type Droits, type Module, type Page } from "./droits.ts";

export const ACTIONS_NOTIFICATION = ["creation", "modification", "suppression"] as const;
export type ActionNotification = (typeof ACTIONS_NOTIFICATION)[number];

/** Les modules, plus « administration » (comptes et mots de passe : super administrateur seulement). */
export type ModuleNotification = Module | "administration";

/** Module de chaque type d'élément notifié. */
export const MODULE_DE_L_OBJET = {
  site: "personnel",
  departement: "personnel",
  poste: "personnel",
  employe: "personnel",
  profil_horaire: "planning",
  rotation: "planning",
  groupe: "planning",
  affectation: "planning",
  regle_horaire: "planning",
  horaire_dynamique: "planning",
  pointage: "presence",
  // Pointage fait par l'employé depuis son appareil (Mon pointage).
  pointage_distance: "presence",
  evenement: "presence",
  absence: "presence",
  droit_conge: "presence",
  compteur: "presence",
  utilisateur: "administration",
  mot_de_passe: "administration",
  apparence: "administration",
  entreprise: "administration",
} as const satisfies Record<string, ModuleNotification>;

export type ObjetNotification = keyof typeof MODULE_DE_L_OBJET;

export const estObjetNotification = (valeur: string): valeur is ObjetNotification => valeur in MODULE_DE_L_OBJET;
export const estActionNotification = (valeur: string): valeur is ActionNotification =>
  (ACTIONS_NOTIFICATION as readonly string[]).includes(valeur);

/** Page qui donne le droit de voir chaque objet (absente : administration, super administrateur seulement). */
const PAGE_DE_L_OBJET: Record<ObjetNotification, Page | null> = {
  site: "sites",
  departement: "departements",
  poste: "postes",
  employe: "personnes",
  profil_horaire: "profils_horaires",
  rotation: "rotations",
  groupe: "groupes",
  affectation: "affectations",
  regle_horaire: "horaire_dynamique",
  horaire_dynamique: "horaire_dynamique",
  pointage: "pointages_manuels",
  // Vu là où le pointage s'affiche, avec sa position et sa photo.
  pointage_distance: "detail_jour",
  evenement: "evenements",
  absence: "absences",
  droit_conge: "droits_conges",
  compteur: "compteurs",
  utilisateur: null,
  mot_de_passe: null,
  apparence: null,
  entreprise: null,
};

/** Objets dont ce compte voit les notifications : ceux de ses pages, plus l'administration pour un super administrateur. */
export function objetsNotifications(droits: Droits): ObjetNotification[] {
  return (Object.keys(PAGE_DE_L_OBJET) as ObjetNotification[]).filter((objet) => {
    const page = PAGE_DE_L_OBJET[objet];
    return page ? peutAcceder(droits, page) : droits.estSuperAdmin;
  });
}
