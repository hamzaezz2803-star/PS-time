import "server-only";

import { inArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { APPARENCE_PAR_DEFAUT, apparenceDepuisReglages, type Apparence } from "@/lib/metier/apparence";
import { obtenirBase } from "./base";
import { parametres } from "./schema";

/** Étiquette du cache de l'apparence, vidée par l'action d'enregistrement. */
export const ETIQUETTE_APPARENCE = "apparence";

/**
 * Thème et police de l'installation. Lus sur toutes les pages (mise en page racine) : gardés
 * en cache et relus aussitôt après un changement. Base injoignable : apparence par défaut.
 */
export async function lireApparence(): Promise<Apparence> {
  "use cache";
  cacheTag(ETIQUETTE_APPARENCE);
  cacheLife("hours");
  try {
    const reglages = await obtenirBase()
      .select({ cle: parametres.cle, valeur: parametres.valeur })
      .from(parametres)
      .where(inArray(parametres.cle, ["theme", "police"]));
    return apparenceDepuisReglages(reglages);
  } catch (erreur) {
    console.error("Échec de la lecture de l'apparence", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return APPARENCE_PAR_DEFAUT;
  }
}

/** Enregistre le thème et la police (création ou mise à jour de chaque réglage) dans une transaction. */
export async function enregistrerApparence(apparence: Apparence, auteurId: string): Promise<void> {
  await obtenirBase().transaction(async (transaction) => {
    for (const [cle, valeur] of [["theme", apparence.theme], ["police", apparence.police]] as const) {
      await transaction
        .insert(parametres)
        .values({ cle, valeur, modifiePar: auteurId })
        .onDuplicateKeyUpdate({ set: { valeur: sql`values(${parametres.valeur})`, modifiePar: auteurId } });
    }
  });
}
