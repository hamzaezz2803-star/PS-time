import "server-only";

import { and, asc, eq, gte, lt } from "drizzle-orm";
import { COMPTEURS_JOURS_MAX, FUSEAU_HORAIRE, UN_JOUR_MILLISECONDES } from "@/lib/constantes";
import { joursEntre } from "@/lib/metier/compteurs/periodes";
import { horaireDuProfil, type JourService } from "@/lib/metier/compteurs/variables";
import { jourDansFuseau, jourEtMinuteLocaux } from "@/lib/metier/dates";
import { planningDuJour } from "@/lib/metier/planning-jour";
import { obtenirBase } from "./base";
import { chargerHoraireDynamique } from "./horaire-dynamique";
import { chargerPlanning, groupesDesEmployes } from "./planning";
import { pointages } from "./schema";

const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;
export const estJourValide = (jour: string) => FORMAT_JOUR.test(jour) && new Date(`${jour}T00:00:00Z`).toISOString().startsWith(jour);

export type ResultatJours = { ok: true; jours: JourService[] } | { ok: false; erreur: "dates" | "employe" };

/** Pointages de l'employé, en heure de Casablanca, avec une marge d'un jour de chaque côté (fuseau). */
async function pointagesLocaux(employeId: string, debut: string, fin: string) {
  const depuis = new Date(Date.parse(`${debut}T00:00:00Z`) - UN_JOUR_MILLISECONDES);
  const jusqua = new Date(Date.parse(`${fin}T00:00:00Z`) + 2 * UN_JOUR_MILLISECONDES);
  const lignes = await obtenirBase()
    .select({ horodatage: pointages.horodatage })
    .from(pointages)
    .where(and(eq(pointages.employeId, employeId), gte(pointages.horodatage, depuis), lt(pointages.horodatage, jusqua)))
    .orderBy(asc(pointages.horodatage));
  return lignes.map((ligne) => ({ horodatage: ligne.horodatage, ...jourEtMinuteLocaux(ligne.horodatage, FUSEAU_HORAIRE) }));
}

/**
 * Journées de service d'un employé, une par jour de `debut` à `fin` (même sans pointage) :
 * horaire prévu (horaire dynamique, sinon rotation) et pointages du jour. `maximumJours` au plus
 * (62 pour les compteurs, une année pour le planning).
 */
export async function chargerJoursService(employeId: string, debut: string, fin: string, maximumJours = COMPTEURS_JOURS_MAX): Promise<ResultatJours> {
  if (!estJourValide(debut) || !estJourValide(fin) || fin < debut) return { ok: false, erreur: "dates" };
  const jours = joursEntre(debut, fin);
  if (jours.length > maximumJours) return { ok: false, erreur: "dates" };

  const [employe] = await groupesDesEmployes([employeId]);
  if (!employe) return { ok: false, erreur: "employe" };
  const locaux = await pointagesLocaux(employeId, debut, fin);
  const [planning, horaireDynamique] = await Promise.all([
    chargerPlanning([employe]),
    chargerHoraireDynamique(locaux.map((pointage) => ({ employeId, horodatage: pointage.horodatage }))),
  ]);
  const donnees = { ...planning, horaireDynamique };

  return {
    ok: true,
    jours: jours.map((jour) => {
      const prevu = planningDuJour(employe, jour, donnees);
      return {
        jour,
        horaire: prevu.type === "travail" ? horaireDuProfil(prevu.profil) : null,
        profil: prevu.type === "travail" ? { code: prevu.profil.code, nom: prevu.profil.nom, estDynamique: prevu.rotation === null } : null,
        pointages: locaux.filter((pointage) => pointage.jour === jour).map((pointage) => pointage.minutes),
      };
    }),
  };
}

/** Aujourd'hui à Casablanca (AAAA-MM-JJ). */
export const aujourdhuiLocal = () => jourDansFuseau(new Date(), FUSEAU_HORAIRE);
