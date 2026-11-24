import "server-only";

import { and, asc, eq, gte, inArray, isNull, lt, lte } from "drizzle-orm";
import { FUSEAU_HORAIRE, UN_JOUR_MILLISECONDES } from "@/lib/constantes";
import { jourDansFuseau } from "@/lib/metier/dates";
import { evenementRetenu, type EvenementCandidat, type SaisieEvenement } from "@/lib/metier/evenements";
import { obtenirBase } from "./base";
import { evenements, evenementsEmployes, pointages } from "./schema";

type Concurrent = EvenementCandidat & { employeId: string; evenementId: string; code: string; debut: string; fin: string };
type Ajout = { employeIds: string[]; evenementId: string; saisie: SaisieEvenement };

/** Vrai si l'événement de ce droit est retenu ce jour-là pour cet employé (sinon il ne consomme rien). */
export type EstRetenu = (employeId: string, evenementId: string, jour: string) => boolean;

/**
 * Événements en journées entières (tous motifs) et jours pointés (jusqu'à aujourd'hui) des
 * employés sur l'intervalle : un congé neutralisé ce jour-là par un événement plus prioritaire
 * (maladie) ou par un pointage n'est pas décompté. `ajout` : absence pas encore enregistrée.
 */
export async function chargerConcurrence(employeIds: string[], debut: string, fin: string, aujourdhui: string, ajout?: Ajout): Promise<EstRetenu> {
  const finPointages = fin < aujourdhui ? fin : aujourdhui;
  const [lignes, regleAjout, horodatages] = await Promise.all([
    obtenirBase()
      .select({
        employeId: evenementsEmployes.employeId,
        evenementId: evenementsEmployes.evenementId,
        code: evenements.code,
        priorite: evenements.priorite,
        neutralisePointage: evenements.estPrioritaireSurPointages,
        debut: evenementsEmployes.dateDebut,
        fin: evenementsEmployes.dateFin,
      })
      .from(evenementsEmployes)
      .innerJoin(evenements, eq(evenements.id, evenementsEmployes.evenementId))
      .where(and(inArray(evenementsEmployes.employeId, employeIds), isNull(evenementsEmployes.debutMinutes), lte(evenementsEmployes.dateDebut, fin), gte(evenementsEmployes.dateFin, debut))),
    ajout
      ? obtenirBase().select({ code: evenements.code, priorite: evenements.priorite, neutralisePointage: evenements.estPrioritaireSurPointages }).from(evenements).where(eq(evenements.id, ajout.evenementId))
      : Promise.resolve([]),
    debut > finPointages
      ? Promise.resolve([])
      : obtenirBase()
          .select({ employeId: pointages.employeId, horodatage: pointages.horodatage })
          .from(pointages)
          .where(
            and(
              inArray(pointages.employeId, employeIds),
              gte(pointages.horodatage, new Date(Date.parse(`${debut}T00:00:00Z`) - UN_JOUR_MILLISECONDES)),
              lt(pointages.horodatage, new Date(Date.parse(`${finPointages}T00:00:00Z`) + 2 * UN_JOUR_MILLISECONDES)),
            ),
          )
          .orderBy(asc(pointages.horodatage)),
  ]);

  const concurrents: Concurrent[] = [...lignes];
  if (ajout && regleAjout[0] && ajout.saisie.debutMinutes === null) {
    for (const employeId of ajout.employeIds) concurrents.push({ ...regleAjout[0], employeId, evenementId: ajout.evenementId, debut: ajout.saisie.debut, fin: ajout.saisie.fin });
  }
  // Même ordre que partout ailleurs (code) : à priorité égale, le premier l'emporte.
  concurrents.sort((a, b) => a.code.localeCompare(b.code));
  const joursPointes = new Set(horodatages.map((ligne) => `${ligne.employeId}|${jourDansFuseau(ligne.horodatage, FUSEAU_HORAIRE)}`));

  return (employeId, evenementId, jour) => {
    const candidats = concurrents.filter((concurrent) => concurrent.employeId === employeId && concurrent.debut <= jour && jour <= concurrent.fin);
    if (candidats.length === 0) return true;
    return evenementRetenu(candidats, joursPointes.has(`${employeId}|${jour}`))?.evenementId === evenementId;
  };
}
