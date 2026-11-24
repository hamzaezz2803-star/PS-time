import type { Doigt } from "@/lib/constantes";
import { decrireDoigt } from "@/lib/metier/acces-pointage";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

const { acces } = TEXTES_PERSONNES;

/** Nom lisible d'un doigt : « Index droit », « Pouce gauche ». */
export function nomDoigt(doigt: Doigt): string {
  const { main, rang } = decrireDoigt(doigt);
  return acces.doigt(acces.nomsDoigts[rang], main);
}
