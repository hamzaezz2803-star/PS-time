/**
 * Badgeuse d'exemple montrée sur demande, toujours sous un bandeau « Exemple » : elle explique
 * ce qu'affiche une détection quand aucun appareil n'est branché. Jamais mêlée aux vraies
 * badgeuses, jamais envoyée au serveur. Fonctions pures, testées dans exemple.test.ts.
 */
import { heureLocale, texteHeureLocale, type EtatBadgeuse } from "./etat.ts";

/** Adresse de l'exemple : un réseau de bureau courant, affichée avec la mention « Exemple ». */
export const ADRESSE_EXEMPLE = "192.168.1.201";
/** Retard de l'horloge de l'exemple, pour montrer « Heure à régler » puis la synchronisation. */
const RETARD_EXEMPLE_SECONDES = 44 * 60;

export function badgeuseExemple(maintenant: Date, fuseau: string): EtatBadgeuse {
  const heure = heureLocale(new Date(maintenant.getTime() - RETARD_EXEMPLE_SECONDES * 1000), fuseau);
  return {
    adresse: ADRESSE_EXEMPLE,
    statut: "en_ligne",
    nom: "MB360",
    numeroSerie: "EXEMPLE-0001",
    version: "Ver 6.60",
    heureAppareil: texteHeureLocale(heure),
    ecartSecondes: -RETARD_EXEMPLE_SECONDES,
    utilisateurs: 42,
    pointages: 1873,
    verifieLe: maintenant.toISOString(),
  };
}

/** Ce que donne la synchronisation de l'exemple : la badgeuse prend l'heure du serveur. */
export function synchroniserExemple(badgeuse: EtatBadgeuse, maintenant: Date, fuseau: string): EtatBadgeuse {
  return { ...badgeuse, heureAppareil: texteHeureLocale(heureLocale(maintenant, fuseau)), ecartSecondes: 0, verifieLe: maintenant.toISOString() };
}
