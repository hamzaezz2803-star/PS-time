import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, lt, or, type SQL } from "drizzle-orm";
import { FUSEAU_HORAIRE } from "@/lib/constantes";
import { heureLocaleVersUtc } from "@/lib/metier/pointages";
import { motifContient } from "@/lib/metier/recherche";
import type { DonneesPointages, RecherchePointages } from "@/lib/validation/pointage";
import type { PointageListe } from "@/types";
import { obtenirBase } from "./base";
import { departements, employes, photosEmployes, pointages, utilisateurs } from "./schema";

const MILLISECONDES_PAR_JOUR = 86_400_000;

/** Condition SQL des filtres (paramétrée) : employé par nom ou matricule, jour local. */
function conditionRecherche(recherche: RecherchePointages): SQL | undefined {
  const conditions: (SQL | undefined)[] = [eq(pointages.source, "manuel")];
  if (recherche.employe) {
    const motif = motifContient(recherche.employe);
    conditions.push(or(ilike(employes.nom, motif), ilike(employes.prenom, motif), ilike(employes.matricule, motif)));
  }
  const debutJour = recherche.jour ? heureLocaleVersUtc(recherche.jour, "00:00", FUSEAU_HORAIRE) : null;
  if (debutJour) {
    // Le jour local de l'entreprise, converti en UTC (peut commencer la veille en UTC).
    conditions.push(gte(pointages.horodatage, debutJour), lt(pointages.horodatage, new Date(debutJour.getTime() + MILLISECONDES_PAR_JOUR)));
  }
  return and(...conditions);
}

/** Une page des pointages manuels, du plus récent au plus ancien. */
export async function listerPointagesManuels(page: number, parPage: number, recherche: RecherchePointages): Promise<PointageListe[]> {
  return obtenirBase()
    .select({
      id: pointages.id,
      employeId: employes.id,
      groupeId: employes.groupeId,
      prenom: employes.prenom,
      nom: employes.nom,
      matricule: employes.matricule,
      departement: departements.nom,
      photoModifieeLe: photosEmployes.modifieLe,
      horodatage: pointages.horodatage,
      etat: pointages.etat,
      remarque: pointages.remarque,
      saisiPar: utilisateurs.nom,
    })
    .from(pointages)
    .innerJoin(employes, eq(employes.id, pointages.employeId))
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .leftJoin(photosEmployes, eq(photosEmployes.employeId, employes.id))
    .leftJoin(utilisateurs, eq(utilisateurs.id, pointages.saisiPar))
    .where(conditionRecherche(recherche))
    .orderBy(desc(pointages.horodatage), desc(pointages.creeLe))
    .limit(parPage)
    .offset((page - 1) * parPage);
}

export async function compterPointagesManuels(recherche: RecherchePointages): Promise<number> {
  const [resultat] = await obtenirBase()
    .select({ total: count() })
    .from(pointages)
    .innerJoin(employes, eq(employes.id, pointages.employeId))
    .where(conditionRecherche(recherche));
  return resultat?.total ?? 0;
}

/**
 * Enregistre le même pointage pour chaque employé, en une requête. Un pointage déjà présent
 * (même employé, même instant, même état) est laissé tel quel. Renvoie le nombre d'ajouts.
 */
export async function insererPointagesManuels(donnees: DonneesPointages, saisiPar: string): Promise<number> {
  return obtenirBase().transaction(async (transaction) => {
    const existants = await transaction
      .select({ employeId: pointages.employeId })
      .from(pointages)
      .where(and(inArray(pointages.employeId, donnees.employeIds), eq(pointages.horodatage, donnees.horodatage), eq(pointages.etat, donnees.etat)));
    const dejaPointes = new Set(existants.map((pointage) => pointage.employeId));
    const nouveaux = donnees.employeIds.filter((employeId) => !dejaPointes.has(employeId));
    if (nouveaux.length === 0) return 0;

    await transaction
      .insert(pointages)
      .values(
        nouveaux.map((employeId) => ({
          id: crypto.randomUUID(),
          employeId,
          horodatage: donnees.horodatage,
          etat: donnees.etat,
          source: "manuel",
          remarque: donnees.remarque,
          saisiPar,
        })),
      )
      // Saisie simultanée du même pointage : le doublon est laissé tel quel, les autres erreurs restent signalées.
      .onConflictDoNothing({ target: [pointages.employeId, pointages.horodatage, pointages.etat] });
    return nouveaux.length;
  });
}

/** Supprime un pointage manuel (jamais un pointage de badgeuse). Renvoie false s'il n'existe plus. */
export async function supprimerPointageManuel(id: string): Promise<boolean> {
  const resultat = await obtenirBase()
    .delete(pointages)
    .where(and(eq(pointages.id, id), eq(pointages.source, "manuel")));
  return (resultat.rowCount ?? 0) > 0;
}

