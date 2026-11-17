/**
 * Notifications : à quel module appartient chaque objet, et qui peut les voir.
 * Fonctions pures, testées dans notifications.test.ts.
 */
import { modulesAccessibles, type Droits, type Module } from "./droits.ts";

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
  utilisateur: "administration",
  mot_de_passe: "administration",
} as const satisfies Record<string, ModuleNotification>;

export type ObjetNotification = keyof typeof MODULE_DE_L_OBJET;

export const estObjetNotification = (valeur: string): valeur is ObjetNotification => valeur in MODULE_DE_L_OBJET;
export const estActionNotification = (valeur: string): valeur is ActionNotification =>
  (ACTIONS_NOTIFICATION as readonly string[]).includes(valeur);

/** Modules dont ce compte voit les notifications. */
export function modulesNotifications(droits: Droits): ModuleNotification[] {
  const modules: ModuleNotification[] = modulesAccessibles(droits);
  return droits.estSuperAdmin ? [...modules, "administration"] : modules;
}
