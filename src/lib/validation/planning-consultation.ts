import { z } from "zod";
import { VUES_PLANNING } from "@/lib/constantes";

/** Affichage lu dans l'adresse (segment), ou null s'il est inconnu. */
export const lireVuePlanning = (segment: string): VuePlanning | null => {
  const analyse = z.enum(VUES_PLANNING).safeParse(segment);
  return analyse.success ? analyse.data : null;
};

export type VuePlanning = (typeof VUES_PLANNING)[number];

/** Tout l'état de l'écran Planning est dans l'URL : /consultation/planning/mensuel|annuel?employe=…&mois=AAAA-MM&annee=AAAA. */
export type SelectionPlanning = { employe: string | null; vue: VuePlanning; mois: string; annee: number };

const ANNEE_MIN = 2000;
const ANNEE_MAX = 2100;

/** Sélection lue dans l'URL ; une valeur invalide reprend sa valeur par défaut (mois et année en cours). */
export function lireSelectionPlanning(vue: VuePlanning, parametres: Record<string, string | string[] | undefined>, aujourdhui: string): SelectionPlanning {
  const texte = (nom: string) => (typeof parametres[nom] === "string" ? (parametres[nom] as string) : "");
  const employe = z.uuid().safeParse(texte("employe"));
  const mois = /^\d{4}-(0[1-9]|1[0-2])$/.test(texte("mois")) ? texte("mois") : aujourdhui.slice(0, 7);
  const annee = Number(texte("annee"));
  return {
    employe: employe.success ? employe.data : null,
    vue,
    mois: Number(mois.slice(0, 4)) >= ANNEE_MIN && Number(mois.slice(0, 4)) <= ANNEE_MAX ? mois : aujourdhui.slice(0, 7),
    annee: Number.isInteger(annee) && annee >= ANNEE_MIN && annee <= ANNEE_MAX ? annee : Number(aujourdhui.slice(0, 4)),
  };
}
