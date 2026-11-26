/**
 * Accès au pointage d'un employé : pointage hors badgeuse (appareils autorisés, conditions) et
 * doigts prévus pour l'enrôlement sur la badgeuse. Fonctions pures, testées dans
 * acces-pointage.test.ts. Aucune donnée biométrique ici : seulement des choix.
 */
import { APPAREILS_POINTAGE, DOIGTS, DROITS_POINTAGE_DISTANCE, type AppareilPointage, type Doigt, type DroitPointageDistance } from "../constantes.ts";

export type AccesPointage = {
  pointageDistance: boolean;
  appareils: AppareilPointage[];
  exigePosition: boolean;
  exigePhoto: boolean;
  /** Droits en plus de la présence (toujours accordée) : mission, heures supplémentaires. */
  droits: DroitPointageDistance[];
  doigts: Doigt[];
};

export const ACCES_PAR_DEFAUT: AccesPointage = { pointageDistance: false, appareils: [], exigePosition: false, exigePhoto: false, droits: [], doigts: [] };

const estAppareil = (valeur: string): valeur is AppareilPointage => (APPAREILS_POINTAGE as readonly string[]).includes(valeur);
const estDoigt = (valeur: number): valeur is Doigt => (DOIGTS as readonly number[]).includes(valeur);

/** Appareils connus, sans doublon, dans l'ordre de la liste (PC, tablette, téléphone). */
export function normaliserAppareils(valeurs: readonly string[]): AppareilPointage[] {
  return APPAREILS_POINTAGE.filter((appareil) => valeurs.some((valeur) => valeur === appareil && estAppareil(valeur)));
}

/** Droits connus (mission, heures sup.), sans doublon, dans l'ordre de la liste. */
export function normaliserDroits(valeurs: readonly string[]): DroitPointageDistance[] {
  return DROITS_POINTAGE_DISTANCE.filter((droit) => valeurs.includes(droit));
}

/** Doigts connus (0 à 9), sans doublon, triés. */
export function normaliserDoigts(valeurs: readonly (string | number)[]): Doigt[] {
  const nombres = valeurs.map((valeur) => (typeof valeur === "number" ? valeur : /^\d$/.test(valeur) ? Number(valeur) : -1));
  return DOIGTS.filter((doigt) => nombres.some((nombre) => nombre === doigt && estDoigt(nombre)));
}

/** Sans autorisation, aucun appareil, condition ni droit n'est gardé (comme la contrainte en base). */
export function accesCoherent(acces: AccesPointage): AccesPointage {
  return acces.pointageDistance ? acces : { ...acces, appareils: [], exigePosition: false, exigePhoto: false, droits: [] };
}

/** Colonnes de la base (une par droit) vers la liste des droits, et inversement. */
export const droitsDepuisColonnes = (mission: boolean, heuresSup: boolean): DroitPointageDistance[] =>
  normaliserDroits([mission ? "mission" : "", heuresSup ? "heures_sup" : ""]);
export const droitsVersColonnes = (droits: readonly DroitPointageDistance[]) => ({
  distanceDroitMission: droits.includes("mission"),
  distanceDroitHeuresSup: droits.includes("heures_sup"),
});

/** Colonnes de la base : appareils « pc,tablette » et doigts « 56 ». */
export const appareilsVersTexte = (appareils: readonly AppareilPointage[]) => normaliserAppareils(appareils).join(",");
export const texteVersAppareils = (texte: string) => normaliserAppareils(texte.split(","));
export const doigtsVersTexte = (doigts: readonly Doigt[]) => normaliserDoigts(doigts).join("");
export const texteVersDoigts = (texte: string) => normaliserDoigts(texte.split(""));

/** Main d'un doigt (0 à 4 : gauche, 5 à 9 : droite) et son rang du pouce (0) à l'auriculaire (4). */
export function decrireDoigt(doigt: Doigt): { main: "gauche" | "droite"; rang: 0 | 1 | 2 | 3 | 4 } {
  return doigt <= 4 ? { main: "gauche", rang: (4 - doigt) as 0 | 1 | 2 | 3 | 4 } : { main: "droite", rang: (doigt - 5) as 0 | 1 | 2 | 3 | 4 };
}
