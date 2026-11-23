import "server-only";

import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { bilanDroit, calculerReports, type BilanDroit, type UniteDroit } from "@/lib/metier/droits-conges";
import type { SaisieEvenement } from "@/lib/metier/evenements";
import { planningDuJour } from "@/lib/metier/planning-jour";
import { theoriqueMinutes } from "@/lib/metier/profil-horaire";
import { obtenirBase } from "./base";
import { chargerPlanning, groupesDesEmployes } from "./planning";
import { droitsConges, evenementsEmployes } from "./schema";

/** Colonnes d'un droit utiles au calcul de son solde (reprises par les listes). */
export const COLONNES_SOLDE = {
  id: droitsConges.id,
  employeId: droitsConges.employeId,
  evenementId: droitsConges.evenementId,
  debut: droitsConges.dateDebut,
  fin: droitsConges.dateFin,
  joursAcquis: droitsConges.joursAcquis,
  joursReliquat: droitsConges.joursReliquat,
  supplement1: droitsConges.supplement1,
  supplement2: droitsConges.supplement2,
  supplement3: droitsConges.supplement3,
  uniteSaisie: droitsConges.uniteSaisie,
  estConfirme: droitsConges.estConfirme,
  estReporte: droitsConges.estReporte,
};

/** Droit dont on calcule le solde. */
export type DroitACalculer = {
  id: string;
  employeId: string;
  evenementId: string;
  debut: string;
  fin: string;
  joursAcquis: number;
  joursReliquat: number;
  supplement1: number;
  supplement2: number;
  supplement3: number;
  uniteSaisie: string;
  estConfirme: boolean;
  estReporte: boolean;
};
type AbsenceSaisie = SaisieEvenement & { id: string; employeId: string; evenementId: string; remarque: string | null };
type Ajout = { employeIds: string[]; evenementId: string; saisie: SaisieEvenement };

/** Unité lue en base (contrainte `check`), ramenée à la journée si elle était inconnue. */
export const lireUniteDroit = (unite: string): UniteDroit => (unite === "heures" || unite === "demi_journee" ? unite : "journee");

const periodeDe = (droit: DroitACalculer, report: number) => ({
  debut: droit.debut,
  fin: droit.fin,
  joursAcquis: droit.joursAcquis,
  joursReliquat: droit.joursReliquat,
  supplements: droit.supplement1 + droit.supplement2 + droit.supplement3,
  unite: lireUniteDroit(droit.uniteSaisie),
  estConfirme: droit.estConfirme,
  report,
});

/**
 * Droits des mêmes employés et événements qui commencent avant (ou avec) les droits demandés :
 * la suite qui permet de calculer les reports d'une période à l'autre.
 */
async function chargerSuites(droits: readonly DroitACalculer[]): Promise<DroitACalculer[]> {
  const dernierDebut = droits.reduce((max, droit) => (droit.debut > max ? droit.debut : max), droits[0].debut);
  const lignes = await obtenirBase()
    .select(COLONNES_SOLDE)
    .from(droitsConges)
    .where(
      and(
        inArray(droitsConges.employeId, [...new Set(droits.map((droit) => droit.employeId))]),
        inArray(droitsConges.evenementId, [...new Set(droits.map((droit) => droit.evenementId))]),
        lte(droitsConges.dateDebut, dernierDebut),
      ),
    );
  const paires = new Set(droits.map((droit) => `${droit.employeId}|${droit.evenementId}`));
  const parId = new Map(lignes.filter((ligne) => paires.has(`${ligne.employeId}|${ligne.evenementId}`)).map((ligne) => [ligne.id, ligne]));
  // Les droits demandés gardent leurs valeurs (contrôle d'une modification avant son enregistrement).
  for (const droit of droits) parId.set(droit.id, droit);
  return [...parId.values()];
}

/** Absences (journées entières et heures) des employés et événements donnés qui touchent l'intervalle. */
async function chargerAbsences(droits: readonly DroitACalculer[]): Promise<AbsenceSaisie[]> {
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
        inArray(evenementsEmployes.employeId, [...new Set(droits.map((droit) => droit.employeId))]),
        inArray(evenementsEmployes.evenementId, [...new Set(droits.map((droit) => droit.evenementId))]),
        lte(evenementsEmployes.dateDebut, fin),
        gte(evenementsEmployes.dateFin, debut),
      ),
    );
}

/**
 * Valeur d'un jour d'absence entière, par employé et unité, d'après son planning : 0 un jour de
 * repos ; 1 en jours (sans planning aussi) ; en heures, la durée prévue (plages fixes), 0 sans planning.
 */
async function chargerValeursJour(employeIds: string[]): Promise<(employeId: string, unite: UniteDroit) => (jour: string) => number> {
  const employes = await groupesDesEmployes(employeIds);
  const planning = await chargerPlanning(employes);
  const groupeDe = new Map(employes.map((employe) => [employe.id, employe.groupeId]));
  return (employeId, unite) => (jour) => {
    const jourPlanning = planningDuJour({ id: employeId, groupeId: groupeDe.get(employeId) ?? null }, jour, planning);
    if (jourPlanning.type === "repos") return 0;
    if (unite !== "heures") return 1;
    return jourPlanning.type === "travail" ? theoriqueMinutes(jourPlanning.profil.plages) / 60 : 0;
  };
}

export type BilanCalcule = BilanDroit & { absences: { saisie: AbsenceSaisie; pris: number; prevus: number }[] };

/**
 * Bilan de chaque droit (même ordre), report de la période précédente compris, avec les absences
 * qui le consomment, et `ajout` compté en plus (contrôle d'une absence avant son enregistrement).
 */
export async function calculerSoldes(droits: readonly DroitACalculer[], aujourdhui: string, ajout?: Ajout): Promise<BilanCalcule[]> {
  if (droits.length === 0) return [];
  const suites = await chargerSuites(droits);
  const [absences, valeurJour] = await Promise.all([chargerAbsences(suites), chargerValeursJour(suites.map((droit) => droit.employeId))]);

  const bilan = (droit: DroitACalculer, report: number): BilanCalcule => {
    const siennes = absences.filter((absence) => absence.employeId === droit.employeId && absence.evenementId === droit.evenementId);
    if (ajout && ajout.evenementId === droit.evenementId && ajout.employeIds.includes(droit.employeId)) {
      siennes.push({ ...ajout.saisie, id: "", employeId: droit.employeId, evenementId: droit.evenementId, remarque: null });
    }
    const periode = periodeDe(droit, report);
    return bilanDroit(periode, siennes, aujourdhui, valeurJour(droit.employeId, periode.unite));
  };

  const reports = calculerReports(
    suites.map((droit) => ({ ...droit, unite: lireUniteDroit(droit.uniteSaisie), soldeSansReport: bilan(droit, 0).soldePrevisionnel })),
  );
  return droits.map((droit) => bilan(droit, reports.get(droit.id) ?? 0));
}

/**
 * Employés dont un droit « bloquant » (solde positif obligatoire) de cet événement deviendrait
 * négatif avec cette absence.
 */
export async function employesAuSoldeInsuffisant(employeIds: string[], evenementId: string, saisie: SaisieEvenement, aujourdhui: string): Promise<string[]> {
  const droits = await obtenirBase()
    .select(COLONNES_SOLDE)
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
