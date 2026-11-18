/**
 * Apparence de l'application (thème de couleurs et police), choisie par le super administrateur.
 * Fonctions pures, testées dans apparence.test.ts.
 */
import { POLICES, POLICE_PAR_DEFAUT, THEMES, THEME_PAR_DEFAUT } from "../constantes.ts";

export type Theme = (typeof THEMES)[number];
export type Police = (typeof POLICES)[number];
export type Apparence = { theme: Theme; police: Police };

export const APPARENCE_PAR_DEFAUT: Apparence = { theme: THEME_PAR_DEFAUT, police: POLICE_PAR_DEFAUT };

export const estTheme = (valeur: string): valeur is Theme => (THEMES as readonly string[]).includes(valeur);
export const estPolice = (valeur: string): valeur is Police => (POLICES as readonly string[]).includes(valeur);

/** Apparence lue dans les réglages enregistrés : une valeur absente ou inconnue garde le choix par défaut. */
export function apparenceDepuisReglages(reglages: readonly { cle: string; valeur: string }[]): Apparence {
  const valeur = (cle: string) => reglages.find((reglage) => reglage.cle === cle)?.valeur ?? "";
  const theme = valeur("theme");
  const police = valeur("police");
  return {
    theme: estTheme(theme) ? theme : APPARENCE_PAR_DEFAUT.theme,
    police: estPolice(police) ? police : APPARENCE_PAR_DEFAUT.police,
  };
}
