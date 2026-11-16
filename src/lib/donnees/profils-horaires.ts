import "server-only";

import { asc, count, eq, inArray } from "drizzle-orm";
import { LIMITE_LISTE_PROGRAMME } from "@/lib/constantes";
import { TYPES_PLAGE, type TypePlage } from "@/lib/metier/profil-horaire";
import type { DonneesProfil } from "@/lib/validation/profil-horaire";
import type { ProfilHoraire } from "@/types";
import { obtenirBase } from "./base";
import { joursRotation, plagesProfils, profilsHoraires } from "./schema";

const estTypePlage = (valeur: string): valeur is TypePlage => (TYPES_PLAGE as readonly string[]).includes(valeur);

/** Profils triés par code, avec leurs plages dans l'ordre de la journée. */
export async function listerProfils(): Promise<ProfilHoraire[]> {
  const base = obtenirBase();
  const [lignes, plages] = await Promise.all([
    base
      .select({
        id: profilsHoraires.id,
        code: profilsHoraires.code,
        nom: profilsHoraires.nom,
        type: profilsHoraires.type,
        estBadge: profilsHoraires.estBadge,
        repasMinimumMinutes: profilsHoraires.repasMinimumMinutes,
        repasMaximumMinutes: profilsHoraires.repasMaximumMinutes,
      })
      .from(profilsHoraires)
      .orderBy(asc(profilsHoraires.code))
      .limit(LIMITE_LISTE_PROGRAMME),
    base
      .select({ profilId: plagesProfils.profilId, debut: plagesProfils.debutMinutes, fin: plagesProfils.finMinutes, type: plagesProfils.type })
      .from(plagesProfils)
      .orderBy(asc(plagesProfils.debutMinutes)),
  ]);
  return lignes.map((profil) => ({
    ...profil,
    type: profil.type === "repos" ? "repos" : "travail",
    plages: plages.flatMap(({ profilId, debut, fin, type }) => (profilId === profil.id && estTypePlage(type) ? [{ debut, fin, type }] : [])),
  }));
}

/** Vrai si tous les identifiants désignent des profils existants. */
export async function profilsExistent(ids: string[]): Promise<boolean> {
  const uniques = [...new Set(ids)];
  if (uniques.length === 0) return true;
  const [resultat] = await obtenirBase().select({ nombre: count() }).from(profilsHoraires).where(inArray(profilsHoraires.id, uniques));
  return resultat.nombre === uniques.length;
}

/**
 * Crée (sans `id`) ou modifie un profil et remplace ses plages, dans une transaction.
 * Renvoie l'identifiant, ou null si le profil à modifier n'existe plus.
 */
export async function enregistrerProfil(id: string | null, donnees: DonneesProfil): Promise<string | null> {
  const { plages, ...champs } = donnees;
  return obtenirBase().transaction(async (transaction) => {
    let idProfil = id;
    if (idProfil) {
      const [existant] = await transaction.select({ id: profilsHoraires.id }).from(profilsHoraires).where(eq(profilsHoraires.id, idProfil)).for("update");
      if (!existant) return null;
      await transaction.update(profilsHoraires).set(champs).where(eq(profilsHoraires.id, idProfil));
      await transaction.delete(plagesProfils).where(eq(plagesProfils.profilId, idProfil));
    } else {
      idProfil = crypto.randomUUID();
      await transaction.insert(profilsHoraires).values({ id: idProfil, ...champs });
    }
    if (plages.length > 0) {
      await transaction
        .insert(plagesProfils)
        .values(plages.map((plage) => ({ profilId: idProfil, debutMinutes: plage.debut, finMinutes: plage.fin, type: plage.type })));
    }
    return idProfil;
  });
}

/** Vrai si une rotation utilise ce profil (la suppression serait refusée par la base). */
export async function profilEstUtilise(id: string): Promise<boolean> {
  const [ligne] = await obtenirBase().select({ id: joursRotation.id }).from(joursRotation).where(eq(joursRotation.profilId, id)).limit(1);
  return ligne !== undefined;
}

/** Supprime un profil ; ses plages partent avec lui (clé « cascade »). */
export async function supprimerProfilParId(id: string): Promise<void> {
  await obtenirBase().delete(profilsHoraires).where(eq(profilsHoraires.id, id));
}
