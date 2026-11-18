import "server-only";

import { inArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { APPARENCE_PAR_DEFAUT, apparenceDepuisReglages, reglagesDepuisApparence, type Apparence } from "@/lib/metier/apparence";
import { obtenirBase } from "./base";
import { parametres } from "./schema";

/** Étiquette du cache de l'apparence, vidée par l'action d'enregistrement. */
export const ETIQUETTE_APPARENCE = "apparence";

/**
 * Apparence de l'installation (thème, couleurs, police, taille du texte). Lue sur toutes les
 * pages (mise en page racine) : gardée en cache et relue aussitôt après un changement.
 * Base injoignable : apparence par défaut.
 */
export async function lireApparence(): Promise<Apparence> {
  "use cache";
  cacheTag(ETIQUETTE_APPARENCE);
  cacheLife("hours");
  try {
    const reglages = await obtenirBase()
      .select({ cle: parametres.cle, valeur: parametres.valeur })
      .from(parametres)
      .where(inArray(parametres.cle, reglagesDepuisApparence(APPARENCE_PAR_DEFAUT).map((reglage) => reglage.cle)));
    return apparenceDepuisReglages(reglages);
  } catch (erreur) {
    console.error("Échec de la lecture de l'apparence", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return APPARENCE_PAR_DEFAUT;
  }
}

/** Enregistre toute l'apparence (création ou mise à jour de chaque réglage) dans une transaction. */
export async function enregistrerApparence(apparence: Apparence, auteurId: string): Promise<void> {
  await obtenirBase().transaction(async (transaction) => {
    for (const { cle, valeur } of reglagesDepuisApparence(apparence)) {
      await transaction
        .insert(parametres)
        .values({ cle, valeur, modifiePar: auteurId })
        .onDuplicateKeyUpdate({ set: { valeur: sql`values(${parametres.valeur})`, modifiePar: auteurId } });
    }
  });
}
