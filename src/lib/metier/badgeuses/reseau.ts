/**
 * Adresses du réseau local à interroger pour trouver les badgeuses.
 * Fonctions pures, testées dans reseau.test.ts.
 */

const MOTIF_IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const estAdresseIPv4 = (texte: string): boolean => MOTIF_IPV4.test(texte);

const versNombre = (adresse: string): number => adresse.split(".").reduce((total, partie) => total * 256 + Number(partie), 0);
const versAdresse = (nombre: number): string => [24, 16, 8, 0].map((decalage) => Math.floor(nombre / 2 ** decalage) % 256).join(".");

/**
 * Vrai pour une adresse de réseau privé (10/8, 172.16/12, 192.168/16) : seules celles-ci sont
 * contactées, jamais une adresse d'Internet.
 */
export function estAdressePrivee(adresse: string): boolean {
  if (!estAdresseIPv4(adresse)) return false;
  const [a, b] = adresse.split(".").map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Nombre de bits du masque (255.255.255.0 donne 24), null si le masque n'est pas valable. */
export function longueurMasque(masque: string): number | null {
  if (!estAdresseIPv4(masque)) return null;
  const binaire = versNombre(masque).toString(2).padStart(32, "0");
  if (!/^1*0*$/.test(binaire)) return null;
  const premierZero = binaire.indexOf("0");
  return premierZero === -1 ? 32 : premierZero;
}

/** Plus grand réseau parcouru : 254 adresses. Un réseau plus large est réduit à la partie du serveur. */
export const LONGUEUR_MASQUE_MIN = 24;

export type ReseauLocal = { adresseServeur: string; reseau: string; longueurMasque: number; reduit: boolean };

/** Réseau parcouru pour une adresse du serveur, null s'il n'est pas privé ou pas valable. */
export function reseauAParcourir(adresseServeur: string, masque: string): ReseauLocal | null {
  const longueur = longueurMasque(masque);
  if (longueur === null || longueur >= 31 || !estAdressePrivee(adresseServeur)) return null;
  const retenue = Math.max(longueur, LONGUEUR_MASQUE_MIN);
  const taille = 2 ** (32 - retenue);
  const debut = Math.floor(versNombre(adresseServeur) / taille) * taille;
  return { adresseServeur, reseau: versAdresse(debut), longueurMasque: retenue, reduit: retenue !== longueur };
}

/** Adresses des appareils possibles du réseau (ni l'adresse du réseau, ni la diffusion, ni le serveur). */
export function adressesDuReseau(reseau: ReseauLocal): string[] {
  const taille = 2 ** (32 - reseau.longueurMasque);
  const debut = versNombre(reseau.reseau);
  const adresses: string[] = [];
  for (let rang = 1; rang < taille - 1; rang += 1) {
    const adresse = versAdresse(debut + rang);
    if (adresse !== reseau.adresseServeur) adresses.push(adresse);
  }
  return adresses;
}

/** Tri des adresses dans l'ordre numérique (192.168.1.9 avant 192.168.1.10). */
export const comparerAdresses = (a: string, b: string): number => versNombre(a) - versNombre(b);
