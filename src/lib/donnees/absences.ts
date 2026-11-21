import "server-only";

import { and, asc, count, desc, eq, gte, inArray, isNull, like, lte, or, type SQL } from "drizzle-orm";
import { FUSEAU_HORAIRE } from "@/lib/constantes";
import { jourDansFuseau } from "@/lib/metier/dates";
import { estDansUnePeriodePrise, saisiesSeChevauchent, type SaisieEvenement } from "@/lib/metier/evenements";
import { motifContient } from "@/lib/metier/recherche";
import type { DonneesAbsences, RechercheAbsences } from "@/lib/validation/absence";
import type { AbsenceListe, EvenementDuJour, EvenementSaisissable } from "@/types";
import { obtenirBase } from "./base";
import { employesAuSoldeInsuffisant } from "./droits-conges-soldes";
import { departements, employes, evenements, evenementsEmployes, periodesEvenements, photosEmployes, utilisateurs } from "./schema";

const typeEvenement = (type: string): "absence" | "presence" => (type === "presence" ? "presence" : "absence");

/** Condition SQL des filtres (paramétrée) : employé par nom ou matricule, jour compris dans la période. */
function conditionRecherche(recherche: RechercheAbsences): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];
  if (recherche.employe) {
    const motif = motifContient(recherche.employe);
    conditions.push(or(like(employes.nom, motif), like(employes.prenom, motif), like(employes.matricule, motif)));
  }
  if (recherche.jour) conditions.push(lte(evenementsEmployes.dateDebut, recherche.jour), gte(evenementsEmployes.dateFin, recherche.jour));
  return and(...conditions);
}

/** Une page des absences, de la plus récente à la plus ancienne. */
export async function listerAbsences(page: number, parPage: number, recherche: RechercheAbsences): Promise<AbsenceListe[]> {
  const lignes = await obtenirBase()
    .select({
      id: evenementsEmployes.id,
      employeId: employes.id,
      prenom: employes.prenom,
      nom: employes.nom,
      matricule: employes.matricule,
      departement: departements.nom,
      photoModifieeLe: photosEmployes.modifieLe,
      evenementCode: evenements.code,
      evenementNom: evenements.nom,
      evenementType: evenements.type,
      debut: evenementsEmployes.dateDebut,
      fin: evenementsEmployes.dateFin,
      debutMinutes: evenementsEmployes.debutMinutes,
      finMinutes: evenementsEmployes.finMinutes,
      remarque: evenementsEmployes.remarque,
      saisiPar: utilisateurs.nom,
    })
    .from(evenementsEmployes)
    .innerJoin(employes, eq(employes.id, evenementsEmployes.employeId))
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .innerJoin(evenements, eq(evenements.id, evenementsEmployes.evenementId))
    .leftJoin(photosEmployes, eq(photosEmployes.employeId, employes.id))
    .leftJoin(utilisateurs, eq(utilisateurs.id, evenementsEmployes.saisiPar))
    .where(conditionRecherche(recherche))
    .orderBy(desc(evenementsEmployes.dateDebut), asc(employes.nom), asc(employes.prenom))
    .limit(parPage)
    .offset((page - 1) * parPage);
  return lignes.map((ligne) => ({ ...ligne, evenementType: typeEvenement(ligne.evenementType) }));
}

export async function compterAbsences(recherche: RechercheAbsences): Promise<number> {
  const [resultat] = await obtenirBase()
    .select({ total: count() })
    .from(evenementsEmployes)
    .innerJoin(employes, eq(employes.id, evenementsEmployes.employeId))
    .where(conditionRecherche(recherche));
  return resultat?.total ?? 0;
}

/** Événements proposés dans la saisie : ceux affichés dans le planning seulement. */
export async function listerEvenementsSaisissables(): Promise<EvenementSaisissable[]> {
  return obtenirBase()
    .select({ id: evenements.id, code: evenements.code, nom: evenements.nom, estSaisiEnHeures: evenements.estSaisiEnHeures })
    .from(evenements)
    .where(eq(evenements.estVisiblePlanning, true))
    .orderBy(asc(evenements.code));
}

export type ResultatEnregistrement =
  | { ok: true; nombre: number; evenementNom: string }
  | { ok: false; erreur: "evenement" | "pas_en_heures" | "hors_periode" | "employe" }
  | { ok: false; erreur: "chevauchement" | "solde_insuffisant"; noms: string[] };

/**
 * Attribue l'événement à chaque employé, dans une transaction qui verrouille les employés :
 * deux saisies simultanées ne peuvent pas créer de chevauchement. Les règles de l'événement
 * (affiché dans le planning, saisie en heures, période de prise) sont revérifiées ici.
 */
export async function enregistrerAbsences(donnees: DonneesAbsences, saisiPar: string): Promise<ResultatEnregistrement> {
  const { saisie } = donnees;
  return obtenirBase().transaction(async (transaction) => {
    const [evenement] = await transaction
      .select({ nom: evenements.nom, estSaisiEnHeures: evenements.estSaisiEnHeures, estVisiblePlanning: evenements.estVisiblePlanning })
      .from(evenements)
      .where(eq(evenements.id, donnees.evenementId));
    if (!evenement || !evenement.estVisiblePlanning) return { ok: false, erreur: "evenement" };
    if (saisie.debutMinutes !== null && !evenement.estSaisiEnHeures) return { ok: false, erreur: "pas_en_heures" };
    const periodes = await transaction
      .select({ debut: periodesEvenements.dateDebut, fin: periodesEvenements.dateFin })
      .from(periodesEvenements)
      .where(eq(periodesEvenements.evenementId, donnees.evenementId));
    if (!estDansUnePeriodePrise(periodes, saisie.debut, saisie.fin)) return { ok: false, erreur: "hors_periode" };

    const concernes = await transaction
      .select({ id: employes.id, prenom: employes.prenom, nom: employes.nom })
      .from(employes)
      .where(inArray(employes.id, donnees.employeIds))
      .for("update");
    if (concernes.length !== donnees.employeIds.length) return { ok: false, erreur: "employe" };

    const existantes = await transaction
      .select({
        employeId: evenementsEmployes.employeId,
        debut: evenementsEmployes.dateDebut,
        fin: evenementsEmployes.dateFin,
        debutMinutes: evenementsEmployes.debutMinutes,
        finMinutes: evenementsEmployes.finMinutes,
      })
      .from(evenementsEmployes)
      .where(and(inArray(evenementsEmployes.employeId, donnees.employeIds), lte(evenementsEmployes.dateDebut, saisie.fin), gte(evenementsEmployes.dateFin, saisie.debut)));
    const enConflit = new Set(existantes.filter((existante) => saisiesSeChevauchent(existante, saisie)).map((existante) => existante.employeId));
    if (enConflit.size > 0) {
      return { ok: false, erreur: "chevauchement", noms: concernes.filter((employe) => enConflit.has(employe.id)).map((employe) => `${employe.prenom} ${employe.nom}`) };
    }
    // Droit aux congés « bloquant » : l'absence ne doit pas rendre le solde négatif.
    const soldeInsuffisant = new Set(await employesAuSoldeInsuffisant(donnees.employeIds, donnees.evenementId, saisie, jourDansFuseau(new Date(), FUSEAU_HORAIRE)));
    if (soldeInsuffisant.size > 0) {
      return { ok: false, erreur: "solde_insuffisant", noms: concernes.filter((employe) => soldeInsuffisant.has(employe.id)).map((employe) => `${employe.prenom} ${employe.nom}`) };
    }

    await transaction.insert(evenementsEmployes).values(
      donnees.employeIds.map((employeId) => ({
        id: crypto.randomUUID(),
        employeId,
        evenementId: donnees.evenementId,
        dateDebut: saisie.debut,
        dateFin: saisie.fin,
        debutMinutes: saisie.debutMinutes,
        finMinutes: saisie.finMinutes,
        remarque: donnees.remarque,
        saisiPar,
      })),
    );
    return { ok: true, nombre: donnees.employeIds.length, evenementNom: evenement.nom };
  });
}

/** Supprime une absence. Renvoie false si elle n'existe plus. */
export async function supprimerAbsence(id: string): Promise<boolean> {
  const [resultat] = await obtenirBase().delete(evenementsEmployes).where(eq(evenementsEmployes.id, id));
  return resultat.affectedRows > 0;
}

/** Vrai si l'événement est attribué à au moins un employé (sa suppression serait refusée par la base). */
export async function evenementEstUtilise(evenementId: string): Promise<boolean> {
  const [ligne] = await obtenirBase().select({ id: evenementsEmployes.id }).from(evenementsEmployes).where(eq(evenementsEmployes.evenementId, evenementId)).limit(1);
  return ligne !== undefined;
}

/** Événements d'un employé qui touchent ce jour (journées entières ou heures), dans l'ordre de la journée. */
export async function evenementsDuJour(employeId: string, jour: string): Promise<EvenementDuJour[]> {
  const lignes = await obtenirBase()
    .select({
      code: evenements.code,
      nom: evenements.nom,
      type: evenements.type,
      debut: evenementsEmployes.dateDebut,
      fin: evenementsEmployes.dateFin,
      debutMinutes: evenementsEmployes.debutMinutes,
      finMinutes: evenementsEmployes.finMinutes,
      remarque: evenementsEmployes.remarque,
    })
    .from(evenementsEmployes)
    .innerJoin(evenements, eq(evenements.id, evenementsEmployes.evenementId))
    .where(and(eq(evenementsEmployes.employeId, employeId), lte(evenementsEmployes.dateDebut, jour), gte(evenementsEmployes.dateFin, jour)))
    .orderBy(asc(evenementsEmployes.debutMinutes));
  return lignes.map((ligne) => ({ ...ligne, type: typeEvenement(ligne.type) }));
}

export type JourneesEvenement = SaisieEvenement & { employeId: string; type: "absence" | "presence" };

/** Événements en journées entières qui touchent la période, pour tous les employés (statistiques). */
export async function evenementsEnJourneesDeLaPeriode(debut: string, fin: string): Promise<JourneesEvenement[]> {
  const lignes = await obtenirBase()
    .select({
      employeId: evenementsEmployes.employeId,
      type: evenements.type,
      debut: evenementsEmployes.dateDebut,
      fin: evenementsEmployes.dateFin,
      debutMinutes: evenementsEmployes.debutMinutes,
      finMinutes: evenementsEmployes.finMinutes,
    })
    .from(evenementsEmployes)
    .innerJoin(evenements, eq(evenements.id, evenementsEmployes.evenementId))
    .where(and(isNull(evenementsEmployes.debutMinutes), lte(evenementsEmployes.dateDebut, fin), gte(evenementsEmployes.dateFin, debut)));
  return lignes.map((ligne) => ({ ...ligne, type: typeEvenement(ligne.type) }));
}
