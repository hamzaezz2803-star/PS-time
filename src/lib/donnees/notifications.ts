import "server-only";

import { and, count, desc, eq, gt, inArray, isNull, lt, ne, or, type SQL } from "drizzle-orm";
import {
  CONSERVATION_NOTIFICATIONS_JOURS,
  LONGUEUR_MAX_LIBELLE_NOTIFICATION,
  NOTIFICATIONS_AFFICHEES_MAX,
} from "@/lib/constantes";
import {
  MODULE_DE_L_OBJET,
  estActionNotification,
  estObjetNotification,
  type ActionNotification,
  type ModuleNotification,
  type ObjetNotification,
} from "@/lib/metier/notifications";
import type { Notification } from "@/types";
import { obtenirBase } from "./base";
import { notifications, utilisateurs } from "./schema";

const MILLISECONDES_PAR_JOUR = 86_400_000;

export type NouvelleNotification = {
  objet: ObjetNotification;
  action: ActionNotification;
  libelle: string | null;
  lien: string | null;
  auteur: { id: string; nom: string };
};

/** Enregistre une action, et retire au passage les notifications trop anciennes. */
export async function enregistrerNotification(nouvelle: NouvelleNotification): Promise<void> {
  const base = obtenirBase();
  await base.insert(notifications).values({
    module: MODULE_DE_L_OBJET[nouvelle.objet],
    action: nouvelle.action,
    objet: nouvelle.objet,
    libelle: nouvelle.libelle?.slice(0, LONGUEUR_MAX_LIBELLE_NOTIFICATION) ?? null,
    lien: nouvelle.lien,
    auteurId: nouvelle.auteur.id,
    auteurNom: nouvelle.auteur.nom,
  });
  const limite = new Date(Date.now() - CONSERVATION_NOTIFICATIONS_JOURS * MILLISECONDES_PAR_JOUR);
  await base.delete(notifications).where(lt(notifications.creeLe, limite));
}

/** Notifications visibles : celles des modules du compte. */
const visibles = (modules: ModuleNotification[]): SQL => inArray(notifications.module, modules);

/** Dernières notifications des modules du compte, de la plus récente à la plus ancienne. */
export async function listerNotifications(modules: ModuleNotification[]): Promise<Notification[]> {
  if (modules.length === 0) return [];
  const lignes = await obtenirBase()
    .select({
      id: notifications.id,
      action: notifications.action,
      objet: notifications.objet,
      libelle: notifications.libelle,
      lien: notifications.lien,
      auteurId: notifications.auteurId,
      auteurNom: notifications.auteurNom,
      creeLe: notifications.creeLe,
    })
    .from(notifications)
    .where(visibles(modules))
    .orderBy(desc(notifications.creeLe))
    .limit(NOTIFICATIONS_AFFICHEES_MAX);
  return lignes.flatMap(({ action, objet, ...reste }) =>
    estActionNotification(action) && estObjetNotification(objet) ? [{ ...reste, action, objet }] : [],
  );
}

/** Nombre de notifications non lues : arrivées depuis la dernière ouverture, hors actions du compte lui-même. */
export async function compterNonLues(utilisateurId: string, modules: ModuleNotification[]): Promise<number> {
  if (modules.length === 0) return 0;
  const base = obtenirBase();
  const [compte] = await base.select({ luesLe: utilisateurs.notificationsLuesLe }).from(utilisateurs).where(eq(utilisateurs.id, utilisateurId)).limit(1);
  const depuis = compte?.luesLe ? gt(notifications.creeLe, compte.luesLe) : undefined;
  const [resultat] = await base
    .select({ total: count() })
    .from(notifications)
    .where(and(visibles(modules), depuis, or(isNull(notifications.auteurId), ne(notifications.auteurId, utilisateurId))));
  return resultat?.total ?? 0;
}

/** Toutes les notifications actuelles deviennent lues pour ce compte. */
export async function marquerNotificationsLues(utilisateurId: string): Promise<void> {
  await obtenirBase().update(utilisateurs).set({ notificationsLuesLe: new Date() }).where(eq(utilisateurs.id, utilisateurId));
}
