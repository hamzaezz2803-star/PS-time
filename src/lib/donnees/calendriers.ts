import "server-only";

import { asc, eq } from "drizzle-orm";
import { LIMITE_LISTE_PROGRAMME } from "@/lib/constantes";
import type { DonneesCalendrier } from "@/lib/validation/calendrier";
import type { Calendrier } from "@/types";
import { obtenirBase } from "./base";
import { calendriers, joursRotation } from "./schema";

/** Calendriers triés par heure de début, puis par nom. */
export async function listerCalendriers(): Promise<Calendrier[]> {
  const { creeLe, modifieLe, ...colonnes } = calendriers;
  void creeLe;
  void modifieLe;
  return obtenirBase()
    .select({
      id: colonnes.id,
      nom: colonnes.nom,
      debutMinutes: colonnes.debutMinutes,
      finMinutes: colonnes.finMinutes,
      pauseMinutes: colonnes.pauseMinutes,
      entreeAvantMinutes: colonnes.entreeAvantMinutes,
      entreeApresMinutes: colonnes.entreeApresMinutes,
      sortieAvantMinutes: colonnes.sortieAvantMinutes,
      sortieApresMinutes: colonnes.sortieApresMinutes,
      retardTolereMinutes: colonnes.retardTolereMinutes,
      departAnticipeTolereMinutes: colonnes.departAnticipeTolereMinutes,
      pointageEntreeObligatoire: colonnes.pointageEntreeObligatoire,
      pointageSortieObligatoire: colonnes.pointageSortieObligatoire,
      heuresSupActives: colonnes.heuresSupActives,
      heuresSupApresMinutes: colonnes.heuresSupApresMinutes,
      heuresSupMinimumMinutes: colonnes.heuresSupMinimumMinutes,
      heuresSupMaximumMinutes: colonnes.heuresSupMaximumMinutes,
    })
    .from(calendriers)
    .orderBy(asc(calendriers.debutMinutes), asc(calendriers.nom))
    .limit(LIMITE_LISTE_PROGRAMME);
}

export async function insererCalendrier(donnees: DonneesCalendrier): Promise<string> {
  const id = crypto.randomUUID();
  await obtenirBase().insert(calendriers).values({ id, ...donnees });
  return id;
}

/** Renvoie false si le calendrier n'existe plus. */
export async function mettreAJourCalendrier(id: string, donnees: DonneesCalendrier): Promise<boolean> {
  const [resultat] = await obtenirBase().update(calendriers).set(donnees).where(eq(calendriers.id, id));
  return resultat.affectedRows > 0;
}

/** Vrai si une rotation utilise ce calendrier (la suppression serait refusée). */
export async function calendrierEstUtilise(id: string): Promise<boolean> {
  const [ligne] = await obtenirBase()
    .select({ id: joursRotation.id })
    .from(joursRotation)
    .where(eq(joursRotation.calendrierId, id))
    .limit(1);
  return ligne !== undefined;
}

export async function supprimerCalendrierParId(id: string): Promise<void> {
  await obtenirBase().delete(calendriers).where(eq(calendriers.id, id));
}
