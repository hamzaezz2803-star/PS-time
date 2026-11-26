/**
 * Pointage à distance de l'employé : identifiant de son compte, appareil reconnu, position et
 * carte. Fonctions pures, testées dans pointage-distance.test.ts.
 */
import {
  CARTE_DEMI_CADRE_DEGRES,
  ETATS_PAR_DROIT_POINTAGE,
  ETATS_POINTAGE,
  ETATS_POINTAGE_PRESENCE,
  FORMAT_IDENTIFIANT,
  LONGUEUR_MAX_IDENTIFIANT,
  LONGUEUR_MIN_IDENTIFIANT,
  PHOTO_POINTAGE_TAILLE_MAX_OCTETS,
  PRECISION_POSITION_MAX_METRES,
  type AppareilPointage,
  type DroitPointageDistance,
} from "../constantes.ts";
import { detecterTypePhoto } from "./photo.ts";

type EtatPointage = (typeof ETATS_POINTAGE)[number];

/**
 * Identifiant de connexion de l'employé : son matricule en minuscules. null si le matricule ne
 * peut pas servir d'identifiant (moins de 3 caractères, accents ou autres signes).
 */
export function identifiantDepuisMatricule(matricule: string): string | null {
  const identifiant = matricule.trim().toLowerCase();
  const longueurValide = identifiant.length >= LONGUEUR_MIN_IDENTIFIANT && identifiant.length <= LONGUEUR_MAX_IDENTIFIANT;
  return longueurValide && FORMAT_IDENTIFIANT.test(identifiant) ? identifiant : null;
}

/**
 * Type d'appareil d'après l'en-tête User-Agent du navigateur. Simple contrôle de cohérence avec
 * les appareils autorisés (l'en-tête peut être modifié par un utilisateur averti).
 */
export function detecterAppareil(agentUtilisateur: string): AppareilPointage {
  const agent = agentUtilisateur.toLowerCase();
  // Un iPad récent se présente comme un Mac : il reste reconnu comme ordinateur.
  if (agent.includes("ipad") || agent.includes("tablet") || (agent.includes("android") && !agent.includes("mobile"))) return "tablette";
  if (agent.includes("iphone") || agent.includes("ipod") || agent.includes("android") || agent.includes("mobile")) return "telephone";
  return "pc";
}

export type Position = { latitude: number; longitude: number; precisionMetres: number };

/** Position plausible : coordonnées dans leurs bornes, précision connue et raisonnable. */
export function positionValide(position: Position): boolean {
  const { latitude, longitude, precisionMetres } = position;
  return (
    Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 &&
    Number.isInteger(precisionMetres) && precisionMetres >= 0 && precisionMetres <= PRECISION_POSITION_MAX_METRES
  );
}

/** Coordonnées arrondies à 6 décimales (environ 10 cm), comme en base. */
const arrondir = (valeur: number) => Math.round(valeur * 1e6) / 1e6;

/**
 * Adresse de la carte OpenStreetMap intégrée, centrée sur la position avec un repère fixe.
 * L'employé peut regarder la carte, jamais choisir ou déplacer le repère.
 */
export function adresseCarteIntegree(latitude: number, longitude: number): string {
  const lat = arrondir(latitude);
  const lon = arrondir(longitude);
  const cadre = [lon - CARTE_DEMI_CADRE_DEGRES, lat - CARTE_DEMI_CADRE_DEGRES, lon + CARTE_DEMI_CADRE_DEGRES, lat + CARTE_DEMI_CADRE_DEGRES].map(arrondir).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${cadre}&layer=mapnik&marker=${lat},${lon}`;
}

/** Lien vers la position sur OpenStreetMap (nouvel onglet), pour l'administrateur. */
export function lienCarte(latitude: number, longitude: number): string {
  const lat = arrondir(latitude);
  const lon = arrondir(longitude);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
}

/**
 * États que l'employé peut pointer à distance, dans l'ordre d'une journée : la présence (entrée,
 * sortie, pauses) toujours, puis la mission et les heures sup. seulement si elles sont accordées.
 */
export function etatsAutorises(droits: readonly DroitPointageDistance[]): EtatPointage[] {
  const accordes = new Set<EtatPointage>([...ETATS_POINTAGE_PRESENCE, ...droits.flatMap((droit) => ETATS_PAR_DROIT_POINTAGE[droit] ?? [])]);
  return ETATS_POINTAGE.filter((etat) => accordes.has(etat));
}

/** Suite logique d'un pointage, sans tenir compte des droits. */
function etatSuivant(dernierEtat: string | null): EtatPointage {
  switch (dernierEtat) {
    case "entree":
    case "fin_pause":
    case "fin_mission":
    case "fin_heures_sup":
      return "sortie";
    case "debut_pause":
      return "fin_pause";
    case "debut_mission":
      return "fin_mission";
    case "debut_heures_sup":
      return "fin_heures_sup";
    default:
      return "entree";
  }
}

/**
 * État proposé pour le prochain pointage d'après le dernier de la journée, parmi les états
 * accordés (l'employé peut en choisir un autre). Une suite non accordée (droit retiré entre-temps)
 * laisse la place à la sortie, toujours permise.
 */
export function etatPropose(dernierEtat: string | null, autorises: readonly EtatPointage[] = ETATS_POINTAGE): EtatPointage {
  const suivant = etatSuivant(dernierEtat);
  return autorises.includes(suivant) ? suivant : "sortie";
}

/** Photo de pointage acceptée : JPEG (vérifié par sa signature), non vide, 200 Ko au plus. */
export function photoPointageValide(octets: Uint8Array): boolean {
  return octets.length > 0 && octets.length <= PHOTO_POINTAGE_TAILLE_MAX_OCTETS && detecterTypePhoto(octets) === "image/jpeg";
}
