import "server-only";

import { and, asc, eq, gte, lt } from "drizzle-orm";
import { CONSERVATION_PHOTOS_POINTAGE_JOURS, FUSEAU_HORAIRE, UN_JOUR_MILLISECONDES, type AppareilPointage, type DroitPointageDistance } from "@/lib/constantes";
import { droitsDepuisColonnes, texteVersAppareils } from "@/lib/metier/acces-pointage";
import { jourDansFuseau } from "@/lib/metier/dates";
import type { Position } from "@/lib/metier/pointage-distance";
import type { EtatPointage } from "@/lib/validation/pointage";
import { obtenirBase } from "./base";
import { departements, employes, photosPointages, pointages, postes, sites } from "./schema";

/** Ce que l'employé voit de lui-même dans son espace de pointage (jamais de donnée sensible). */
export type EmployePourPointage = {
  prenom: string;
  nom: string;
  matricule: string;
  departement: string;
  poste: string | null;
  site: string | null;
  estAutorise: boolean;
  appareils: AppareilPointage[];
  exigePosition: boolean;
  exigePhoto: boolean;
  /** Droits accordés en plus de la présence : mission, heures sup. */
  droits: DroitPointageDistance[];
};

export async function lireEmployePourPointage(employeId: string): Promise<EmployePourPointage | null> {
  const [ligne] = await obtenirBase()
    .select({
      prenom: employes.prenom,
      nom: employes.nom,
      matricule: employes.matricule,
      departement: departements.nom,
      poste: postes.nom,
      site: sites.nom,
      estAutorise: employes.pointageDistance,
      appareils: employes.appareilsDistance,
      exigePosition: employes.distanceExigePosition,
      exigePhoto: employes.distanceExigePhoto,
      droitMission: employes.distanceDroitMission,
      droitHeuresSup: employes.distanceDroitHeuresSup,
    })
    .from(employes)
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .leftJoin(postes, eq(postes.id, employes.posteId))
    .leftJoin(sites, eq(sites.id, employes.siteId))
    .where(eq(employes.id, employeId))
    .limit(1);
  if (!ligne) return null;
  const { droitMission, droitHeuresSup, ...employe } = ligne;
  return { ...employe, appareils: texteVersAppareils(ligne.appareils), droits: droitsDepuisColonnes(droitMission, droitHeuresSup) };
}

export type PointageDuJourEmploye = { id: string; horodatage: string; etat: string };

/** Pointages du jour (Casablanca) de l'employé, toutes origines, du plus ancien au plus récent. */
export async function listerPointagesDuJour(employeId: string, maintenant = new Date()): Promise<PointageDuJourEmploye[]> {
  const jour = jourDansFuseau(maintenant, FUSEAU_HORAIRE);
  const depuis = new Date(Date.parse(`${jour}T00:00:00Z`) - UN_JOUR_MILLISECONDES);
  const jusqua = new Date(Date.parse(`${jour}T00:00:00Z`) + 2 * UN_JOUR_MILLISECONDES);
  const lignes = await obtenirBase()
    .select({ id: pointages.id, horodatage: pointages.horodatage, etat: pointages.etat })
    .from(pointages)
    .where(and(eq(pointages.employeId, employeId), gte(pointages.horodatage, depuis), lt(pointages.horodatage, jusqua)))
    .orderBy(asc(pointages.horodatage))
    .limit(100);
  return lignes
    .filter((ligne) => jourDansFuseau(ligne.horodatage, FUSEAU_HORAIRE) === jour)
    .map((ligne) => ({ ...ligne, horodatage: ligne.horodatage.toISOString() }));
}

export type NouveauPointageDistance = {
  employeId: string;
  utilisateurId: string;
  etat: EtatPointage;
  appareil: AppareilPointage;
  position: Position | null;
  photo: Buffer | null;
};

/**
 * Enregistre un pointage à distance à l'heure du serveur (jamais celle envoyée par le navigateur),
 * avec sa position et sa photo, dans une transaction. Les photos de plus de 90 jours sont
 * supprimées au passage. Renvoie l'heure retenue, ou null pour un doublon au même instant.
 */
export async function insererPointageDistance(nouveau: NouveauPointageDistance): Promise<Date | null> {
  const horodatage = new Date();
  return obtenirBase().transaction(async (transaction) => {
    const id = crypto.randomUUID();
    const inseres = await transaction
      .insert(pointages)
      .values({
        id,
        employeId: nouveau.employeId,
        horodatage,
        etat: nouveau.etat,
        source: "distance",
        saisiPar: nouveau.utilisateurId,
        appareil: nouveau.appareil,
        latitude: nouveau.position?.latitude ?? null,
        longitude: nouveau.position?.longitude ?? null,
        precisionMetres: nouveau.position?.precisionMetres ?? null,
      })
      .onConflictDoNothing({ target: [pointages.employeId, pointages.horodatage, pointages.etat] })
      .returning({ id: pointages.id });
    if (inseres.length === 0) return null;

    if (nouveau.photo) {
      await transaction.insert(photosPointages).values({ pointageId: id, typeMime: "image/jpeg", contenu: nouveau.photo, tailleOctets: nouveau.photo.length });
    }
    const limite = new Date(horodatage.getTime() - CONSERVATION_PHOTOS_POINTAGE_JOURS * UN_JOUR_MILLISECONDES);
    await transaction.delete(photosPointages).where(lt(photosPointages.creeLe, limite));
    return horodatage;
  });
}

/** Photo d'un pointage à distance, ou null (pas de photo, ou supprimée après 90 jours). */
export async function lirePhotoPointage(pointageId: string): Promise<{ contenu: Buffer; typeMime: string } | null> {
  const [photo] = await obtenirBase()
    .select({ contenu: photosPointages.contenu, typeMime: photosPointages.typeMime })
    .from(photosPointages)
    .where(eq(photosPointages.pointageId, pointageId))
    .limit(1);
  return photo ?? null;
}
