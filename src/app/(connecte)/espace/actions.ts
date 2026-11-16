"use server";

import { peutGererModule } from "@/lib/actions/droits";
import { POINTAGES_DIRECT_MAX } from "@/lib/constantes";
import { listerDerniersPointages } from "@/lib/donnees/pointages";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import type { PointageDirect, Resultat } from "@/types";

/** Derniers pointages pour la carte « en direct » (module Présence requis, relu à chaque appel). */
export async function lireDerniersPointages(): Promise<Resultat<PointageDirect[]>> {
  if (!(await peutGererModule("presence"))) return { ok: false, erreur: TEXTES_EXCEPTIONS.pointages.droits };
  try {
    return { ok: true, donnees: await listerDerniersPointages(POINTAGES_DIRECT_MAX) };
  } catch (erreur) {
    console.error("Échec de la lecture des derniers pointages", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { ok: false, erreur: "lecture" };
  }
}
