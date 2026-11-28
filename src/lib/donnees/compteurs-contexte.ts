import "server-only";

import { and, asc, eq, gte, lte } from "drizzle-orm";
import type { ContexteCalcul } from "@/lib/metier/compteurs/calcul";
import type { JourService, ValeursVariables } from "@/lib/metier/compteurs/variables";
import { codesDesEvenements, variablePris, variableSolde, type CodesCompteurs, type EvenementCompteur } from "@/lib/metier/compteurs/variables-evenements";
import type { CodeEvenementCompteur } from "@/types";
import { obtenirBase } from "./base";
import { calculerSoldes, COLONNES_SOLDE } from "./droits-conges-soldes";
import { droitsConges, evenements, evenementsEmployes } from "./schema";

const typeEvenement = (type: string): "absence" | "presence" => (type === "presence" ? "presence" : "absence");

/** Événements de l'installation qui donnent des variables aux formules des compteurs (JOURS_, MIN_, PRIS_, SOLDE_). */
export async function listerCodesCompteurs(): Promise<CodeEvenementCompteur[]> {
  return obtenirBase()
    .select({ code: evenements.code, nom: evenements.nom, estSoumisDroits: evenements.estSoumisDroits })
    .from(evenements)
    .orderBy(asc(evenements.code));
}


/** Événements d'un employé (journées entières et heures) qui touchent la période. */
async function evenementsDeLEmploye(employeId: string, debut: string, fin: string): Promise<EvenementCompteur[]> {
  const lignes = await obtenirBase()
    .select({
      code: evenements.code,
      type: evenements.type,
      priorite: evenements.priorite,
      neutralisePointage: evenements.estPrioritaireSurPointages,
      debut: evenementsEmployes.dateDebut,
      fin: evenementsEmployes.dateFin,
      debutMinutes: evenementsEmployes.debutMinutes,
      finMinutes: evenementsEmployes.finMinutes,
    })
    .from(evenementsEmployes)
    .innerJoin(evenements, eq(evenements.id, evenementsEmployes.evenementId))
    .where(and(eq(evenementsEmployes.employeId, employeId), lte(evenementsEmployes.dateDebut, fin), gte(evenementsEmployes.dateFin, debut)))
    .orderBy(asc(evenements.code));
  return lignes.map((ligne) => ({ ...ligne, type: typeEvenement(ligne.type) }));
}

/**
 * État des droits aux congés de l'employé à une date : PRIS_<code> (consommé jusqu'à aujourd'hui)
 * et SOLDE_<code> (droit utilisable moins pris) du droit qui couvre la date ; inconnus sans droit.
 */
async function droitsDeLEmploye(employeId: string, codes: CodesCompteurs, debut: string, fin: string, aujourdhui: string): Promise<(jour: string) => ValeursVariables> {
  const lignes =
    codes.droits.length === 0
      ? []
      : await obtenirBase()
          .select({ ...COLONNES_SOLDE, code: evenements.code })
          .from(droitsConges)
          .innerJoin(evenements, eq(evenements.id, droitsConges.evenementId))
          .where(and(eq(droitsConges.employeId, employeId), lte(droitsConges.dateDebut, fin), gte(droitsConges.dateFin, debut)));
  const bilans = await calculerSoldes(lignes, aujourdhui);

  return (jour) => {
    const valeurs: ValeursVariables = {};
    for (const code of codes.droits) {
      const rang = lignes.findIndex((droit) => droit.code === code && droit.debut <= jour && jour <= droit.fin);
      const bilan = rang >= 0 ? bilans[rang] : null;
      valeurs[variablePris(code)] = bilan ? bilan.pris : null;
      valeurs[variableSolde(code)] = bilan ? bilan.soldeAujourdhui : null;
    }
    return valeurs;
  };
}

/**
 * Ce que le calcul des compteurs d'un employé demande en plus des pointages : codes d'événements,
 * ses événements (rattachés à chaque journée) et l'état de ses droits aux congés.
 */
export async function chargerContexteEmploye(
  employeId: string,
  debut: string,
  fin: string,
  aujourdhui: string,
): Promise<{ contexte: ContexteCalcul; avecEvenements: (jours: JourService[]) => JourService[] }> {
  const codes = codesDesEvenements(await listerCodesCompteurs());
  const [evenementsPeriode, droitsAu] = await Promise.all([evenementsDeLEmploye(employeId, debut, fin), droitsDeLEmploye(employeId, codes, debut, fin, aujourdhui)]);
  return {
    contexte: { codes, droitsAu },
    avecEvenements: (jours) => jours.map((jour) => ({ ...jour, evenements: evenementsPeriode.filter((evenement) => evenement.debut <= jour.jour && jour.jour <= evenement.fin) })),
  };
}
