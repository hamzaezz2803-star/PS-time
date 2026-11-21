import "server-only";

import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { bilanDroit, type BilanDroit, type PeriodeDroit } from "@/lib/metier/droits-conges";
import type { SaisieEvenement } from "@/lib/metier/evenements";
import { planningDuJour } from "@/lib/metier/planning-jour";
import { obtenirBase } from "./base";
import { chargerPlanning, groupesDesEmployes } from "./planning";
import { droitsConges, evenementsEmployes } from "./schema";

/** Droit dont on calcule le solde : employé, événement, période et jours. */
export type DroitACalculer = PeriodeDroit & { employeId: string; evenementId: string };
type AbsenceEnJournees = SaisieEvenement & { id: string; employeId: string; evenementId: string; remarque: string | null };

/** Absences en journées entières des employés et événements donnés qui touchent l'intervalle. */
async function chargerAbsences(droits: readonly DroitACalculer[]): Promise<AbsenceEnJournees[]> {
  const debut = droits.reduce((min, droit) => (droit.debut < min ? droit.debut : min), droits[0].debut);
  const fin = droits.reduce((max, droit) => (droit.fin > max ? droit.fin : max), droits[0].fin);
  return obtenirBase()
    .select({
      id: evenementsEmployes.id,
      employeId: evenementsEmployes.employeId,
      evenementId: evenementsEmployes.evenementId,
      debut: evenementsEmployes.dateDebut,
      fin: evenementsEmployes.dateFin,
      debutMinutes: evenementsEmployes.debutMinutes,
      finMinutes: evenementsEmployes.finMinutes,
      remarque: evenementsEmployes.remarque,
    })
    .from(evenementsEmployes)
    .where(
      and(
        isNull(evenementsEmployes.debutMinutes),
        inArray(evenementsEmployes.employeId, [...new Set(droits.map((droit) => droit.employeId))]),
        inArray(evenementsEmployes.evenementId, [...new Set(droits.map((droit) => droit.evenementId))]),
        lte(evenementsEmployes.dateDebut, fin),
        gte(evenementsEmployes.dateFin, debut),
      ),
    );
}

/** Pour chaque employé : vrai si son planning prévoit un repos ce jour-là (jour non décompté). */
async function chargerReposDesEmployes(employeIds: string[]): Promise<(employeId: string) => (jour: string) => boolean> {
  const employes = await groupesDesEmployes(employeIds);
  const planning = await chargerPlanning(employes);
  const groupeDe = new Map(employes.map((employe) => [employe.id, employe.groupeId]));
  return (employeId) => (jour) => planningDuJour({ id: employeId, groupeId: groupeDe.get(employeId) ?? null }, jour, planning).type === "repos";
}

/**
 * Bilan de chaque droit (même ordre), avec les absences qui le consomment, et `ajout` compté en
 * plus pour un employé (contrôle d'une absence avant son enregistrement). Trois lectures en tout.
 */
export async function calculerSoldes(
  droits: readonly DroitACalculer[],
  aujourdhui: string,
  ajout?: { employeIds: string[]; evenementId: string; saisie: SaisieEvenement },
): Promise<(BilanDroit & { absences: { saisie: AbsenceEnJournees; pris: number; prevus: number }[] })[]> {
  if (droits.length === 0) return [];
  const [absences, reposDe] = await Promise.all([chargerAbsences(droits), chargerReposDesEmployes(droits.map((droit) => droit.employeId))]);
  return droits.map((droit) => {
    const siennes = absences.filter((absence) => absence.employeId === droit.employeId && absence.evenementId === droit.evenementId);
    if (ajout && ajout.evenementId === droit.evenementId && ajout.employeIds.includes(droit.employeId)) {
      siennes.push({ ...ajout.saisie, id: "", employeId: droit.employeId, evenementId: droit.evenementId, remarque: null });
    }
    return bilanDroit(droit, siennes, aujourdhui, reposDe(droit.employeId));
  });
}

/**
 * Employés dont un droit « bloquant » de cet événement deviendrait négatif avec cette absence.
 * Seules les absences en journées entières sont décomptées : une saisie en heures passe toujours.
 */
export async function employesAuSoldeInsuffisant(employeIds: string[], evenementId: string, saisie: SaisieEvenement, aujourdhui: string): Promise<string[]> {
  if (saisie.debutMinutes !== null) return [];
  const droits = await obtenirBase()
    .select({
      employeId: droitsConges.employeId,
      evenementId: droitsConges.evenementId,
      debut: droitsConges.dateDebut,
      fin: droitsConges.dateFin,
      joursAcquis: droitsConges.joursAcquis,
      joursReliquat: droitsConges.joursReliquat,
    })
    .from(droitsConges)
    .where(
      and(
        inArray(droitsConges.employeId, employeIds),
        eq(droitsConges.evenementId, evenementId),
        eq(droitsConges.estBloquant, true),
        lte(droitsConges.dateDebut, saisie.fin),
        gte(droitsConges.dateFin, saisie.debut),
      ),
    );
  const soldes = await calculerSoldes(droits, aujourdhui, { employeIds, evenementId, saisie });
  return [...new Set(droits.filter((_, rang) => soldes[rang].soldePrevisionnel < 0).map((droit) => droit.employeId))];
}
