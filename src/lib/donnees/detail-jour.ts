import "server-only";

import { and, asc, eq, gte, lt } from "drizzle-orm";
import { DETAIL_POINTAGES_MAX, FUSEAU_HORAIRE, UN_JOUR_MILLISECONDES } from "@/lib/constantes";
import { calculerCompteurs, historiqueJournalier, type CacheFormules, type ValeurCompteur } from "@/lib/metier/compteurs/calcul";
import { ajouterJours, periodesDeLaDate, type Periodicite } from "@/lib/metier/compteurs/periodes";
import { jourDansFuseau } from "@/lib/metier/dates";
import { messageErreurFormule } from "@/lib/textes/formules";
import { evenementRetenu } from "@/lib/metier/evenements";
import type { DetailJour, EvenementDuJour, ValeurAffichee } from "@/types";
import { resumerJour } from "@/lib/metier/resume-jour";
import { evenementsDuJour, evenementsEnJourneesDeLEmploye } from "./absences";
import { obtenirBase } from "./base";
import { aujourdhuiLocal, chargerJoursService, estJourValide } from "./compteurs-calcul";
import { listerCompteursActifs } from "./compteurs";
import { evaluerPointages } from "./planning";
import { departements, employes, photosPointages, pointages, utilisateurs } from "./schema";

// Formules compilées gardées d'une demande à l'autre (la clé contient la version : jamais périmées).
const cache: CacheFormules = new Map();

const versAffichee = (valeur: ValeurCompteur): ValeurAffichee => ({
  idCompteur: valeur.idCompteur,
  valeur: valeur.ok ? valeur.valeur : null,
  message: valeur.ok ? null : messageErreurFormule(valeur.erreur),
});

async function employeDuDetail(employeId: string) {
  const [employe] = await obtenirBase()
    .select({ id: employes.id, prenom: employes.prenom, nom: employes.nom, matricule: employes.matricule, groupeId: employes.groupeId, departement: departements.nom })
    .from(employes)
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .where(eq(employes.id, employeId))
    .limit(1);
  return employe;
}

/** Pointages du jour local (Casablanca), avec leur résultat d'après le planning. */
async function pointagesDuJour(employe: { id: string; groupeId: string | null }, date: string): Promise<DetailJour["pointages"]> {
  const depuis = new Date(Date.parse(`${date}T00:00:00Z`) - UN_JOUR_MILLISECONDES);
  const jusqua = new Date(Date.parse(`${date}T00:00:00Z`) + 2 * UN_JOUR_MILLISECONDES);
  const lignes = await obtenirBase()
    .select({
      id: pointages.id,
      horodatage: pointages.horodatage,
      etat: pointages.etat,
      source: pointages.source,
      remarque: pointages.remarque,
      // Auteur d’une saisie manuelle : nom et identifiant de connexion (jamais de donnée sensible).
      saisiParNom: utilisateurs.nom,
      saisiParIdentifiant: utilisateurs.identifiant,
      // Pointage à distance : appareil, position et présence d'une photo (servie à part).
      appareil: pointages.appareil,
      latitude: pointages.latitude,
      longitude: pointages.longitude,
      photoId: photosPointages.pointageId,
    })
    .from(pointages)
    .leftJoin(utilisateurs, eq(utilisateurs.id, pointages.saisiPar))
    .leftJoin(photosPointages, eq(photosPointages.pointageId, pointages.id))
    .where(and(eq(pointages.employeId, employe.id), gte(pointages.horodatage, depuis), lt(pointages.horodatage, jusqua)))
    .orderBy(asc(pointages.horodatage))
    .limit(DETAIL_POINTAGES_MAX * 3);
  const duJour = lignes.filter((ligne) => jourDansFuseau(ligne.horodatage, FUSEAU_HORAIRE) === date).slice(0, DETAIL_POINTAGES_MAX);
  const statuts = await evaluerPointages(duJour.map((ligne) => ({ employeId: employe.id, groupeId: employe.groupeId, horodatage: ligne.horodatage, etat: ligne.etat })));
  return duJour.map(({ photoId, latitude, longitude, ...ligne }, index) => ({
    ...ligne,
    horodatage: ligne.horodatage.toISOString(),
    position: latitude !== null && longitude !== null ? { latitude, longitude } : null,
    aPhoto: photoId !== null,
    statut: statuts[index],
  }));
}

/** Marque l'événement retenu parmi ceux de la journée entière ; les autres sont « non validés ». */
function validerEvenements(evenementsJour: Omit<EvenementDuJour, "estValide">[], aPointe: boolean): EvenementDuJour[] {
  const retenu = evenementRetenu(evenementsJour.filter((evenement) => evenement.debutMinutes === null), aPointe);
  return evenementsJour.map((evenement) => ({ ...evenement, estValide: evenement.debutMinutes === null ? evenement === retenu : null }));
}

export type ResultatDetailJour = { ok: true; detail: DetailJour } | { ok: false; erreur: "date" | "futur" | "employe" };

/**
 * Détail d'un employé pour une date : identité, horaire prévu et réel, pointages du jour,
 * compteurs actifs (jour, semaine et mois de la date, jours écoulés) et historique journalier
 * des `nombreJours` derniers jours. Tout est lu en une fois (62 jours au plus).
 */
export async function chargerDetailJour(employeId: string, date: string, nombreJours: number): Promise<ResultatDetailJour> {
  if (!estJourValide(date)) return { ok: false, erreur: "date" };
  const periodes = periodesDeLaDate(date, aujourdhuiLocal());
  if (periodes.length === 0) return { ok: false, erreur: "futur" };

  const employe = await employeDuDetail(employeId);
  if (!employe) return { ok: false, erreur: "employe" };

  const debutHistorique = ajouterJours(date, -(nombreJours - 1));
  const debut = periodes.reduce((plusTot, periode) => (periode.debut < plusTot ? periode.debut : plusTot), debutHistorique);
  const fin = periodes.reduce((plusTard, periode) => (periode.finCalcul > plusTard ? periode.finCalcul : plusTard), date);
  const [chargement, compteurs, pointagesJour, evenementsJour, evenementsPeriode] = await Promise.all([
    chargerJoursService(employeId, debut, fin),
    listerCompteursActifs(),
    pointagesDuJour(employe, date),
    evenementsDuJour(employeId, date),
    evenementsEnJourneesDeLEmploye(employeId, debut, fin),
  ]);
  if (!chargement.ok) return { ok: false, erreur: chargement.erreur === "employe" ? "employe" : "date" };

  const valeurs = calculerCompteurs(compteurs, periodes, chargement.jours, cache);
  const parPeriodicite = (periodicite: Periodicite) => valeurs.filter((valeur) => valeur.periodicite === periodicite).map(versAffichee);
  // Chaque jour chargé (historique, semaine et mois) : résumé et compteurs journaliers.
  const valeursJours = historiqueJournalier(compteurs, chargement.jours, cache);
  const jours = chargement.jours.map((jour, rang) => ({ ...resumerJour(jour, evenementsPeriode), valeurs: valeursJours[rang].valeurs.map(versAffichee) }));
  const jourDetail = chargement.jours.find((jour) => jour.jour === date);
  const tries = jourDetail ? [...jourDetail.pointages].sort((a, b) => a - b) : [];
  const [jour, semaine, mois] = periodes;

  return {
    ok: true,
    detail: {
      date,
      employe: { id: employe.id, nomComplet: `${employe.prenom} ${employe.nom}`, matricule: employe.matricule, departement: employe.departement },
      horaire:
        jourDetail?.horaire && jourDetail.profil
          ? {
              profilCode: jourDetail.profil.code,
              profilNom: jourDetail.profil.nom,
              estDynamique: jourDetail.profil.estDynamique,
              ...jourDetail.horaire,
              entree: tries[0] ?? null,
              sortie: tries.length >= 2 && tries[tries.length - 1] > tries[0] ? tries[tries.length - 1] : null,
            }
          : null,
      pointages: pointagesJour,
      evenements: validerEvenements(evenementsJour, tries.length > 0),
      compteurs,
      valeurs: { JOUR: parPeriodicite("JOUR"), SEMAINE: parPeriodicite("SEMAINE"), MOIS: parPeriodicite("MOIS") },
      periodes: { JOUR: jour, SEMAINE: semaine, MOIS: mois },
      jours,
      debutHistorique,
    },
  };
}
