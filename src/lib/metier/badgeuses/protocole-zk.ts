/**
 * Protocole réseau des badgeuses ZKTeco (TCP, port 4370), réduit à ce dont PS Time a besoin :
 * se connecter, lire l'identité et l'état de l'appareil, régler son heure, le remettre en marche.
 * Fonctions pures (construction et lecture des paquets), testées dans protocole-zk.test.ts.
 * Aucune donnée biométrique n'est demandée ni lue (décision du 24/11/2026).
 */

export const COMMANDES_ZK = {
  connexion: 1000,
  sortie: 1001,
  activer: 1002,
  lireOption: 11,
  lireTailles: 50,
  lireHeure: 201,
  reglerHeure: 202,
  lireVersion: 1100,
} as const;

export const REPONSES_ZK = { ok: 2000, erreur: 2001, nonAutorise: 2005 } as const;

const ENTETE_TCP = [0x5050, 0x7d82] as const;
const TAILLE_ENTETE_TCP = 8;
const TAILLE_ENTETE = 8;
const MAX_16_BITS = 65535;
/** Numéro de réponse de départ : le premier paquet envoyé porte ainsi le numéro 0. */
export const NUMERO_REPONSE_INITIAL = MAX_16_BITS - 1;

/** Somme de contrôle d'un paquet (mots de 16 bits, petit-boutiste, complément). */
export function sommeDeControle(octets: Uint8Array): number {
  let somme = 0;
  let i = 0;
  for (; i + 1 < octets.length; i += 2) {
    somme += octets[i] | (octets[i + 1] << 8);
    if (somme > MAX_16_BITS) somme -= MAX_16_BITS;
  }
  if (i < octets.length) somme += octets[octets.length - 1];
  while (somme > MAX_16_BITS) somme -= MAX_16_BITS;
  somme = -(somme + 1);
  while (somme < 0) somme += MAX_16_BITS;
  return somme;
}

/**
 * Paquet TCP complet pour une commande. Comme les badgeuses l'attendent, la somme de contrôle
 * porte sur le numéro précédent et le paquet part avec le numéro suivant.
 */
export function construirePaquet(commande: number, session: number, numeroPrecedent: number, donnees: Uint8Array = new Uint8Array()): Uint8Array {
  const corps = new Uint8Array(TAILLE_ENTETE + donnees.length);
  const vue = new DataView(corps.buffer);
  vue.setUint16(0, commande, true);
  vue.setUint16(2, 0, true);
  vue.setUint16(4, session, true);
  vue.setUint16(6, numeroPrecedent, true);
  corps.set(donnees, TAILLE_ENTETE);
  vue.setUint16(2, sommeDeControle(corps), true);
  vue.setUint16(6, (numeroPrecedent + 1) % MAX_16_BITS, true);

  const paquet = new Uint8Array(TAILLE_ENTETE_TCP + corps.length);
  const vuePaquet = new DataView(paquet.buffer);
  vuePaquet.setUint16(0, ENTETE_TCP[0], true);
  vuePaquet.setUint16(2, ENTETE_TCP[1], true);
  vuePaquet.setUint32(4, corps.length, true);
  paquet.set(corps, TAILLE_ENTETE_TCP);
  return paquet;
}

export type ReponseZk = { commande: number; session: number; numero: number; donnees: Uint8Array };

/**
 * Lit une réponse reçue. Renvoie « incomplet » tant que tous les octets annoncés ne sont pas
 * arrivés, null si ce n'est pas une réponse de badgeuse.
 */
export function lireReponse(octets: Uint8Array): ReponseZk | "incomplet" | null {
  if (octets.length < TAILLE_ENTETE_TCP) return "incomplet";
  const vue = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  if (vue.getUint16(0, true) !== ENTETE_TCP[0] || vue.getUint16(2, true) !== ENTETE_TCP[1]) return null;
  const longueur = vue.getUint32(4, true);
  if (longueur < TAILLE_ENTETE || longueur > 1_000_000) return null;
  if (octets.length < TAILLE_ENTETE_TCP + longueur) return "incomplet";
  return {
    commande: vue.getUint16(8, true),
    session: vue.getUint16(12, true),
    numero: vue.getUint16(14, true),
    donnees: octets.slice(TAILLE_ENTETE_TCP + TAILLE_ENTETE, TAILLE_ENTETE_TCP + longueur),
  };
}

/** Date et heure telles qu'affichées par la badgeuse (heure locale, sans fuseau). */
export type HeureLocale = { annee: number; mois: number; jour: number; heures: number; minutes: number; secondes: number };

const SECONDES_PAR_JOUR = 86_400;

/** Heure au format des badgeuses (secondes comptées sur des mois de 31 jours depuis 2000). */
export function encoderHeure(h: HeureLocale): number {
  const jours = (h.annee % 100) * 12 * 31 + (h.mois - 1) * 31 + (h.jour - 1);
  return jours * SECONDES_PAR_JOUR + (h.heures * 60 + h.minutes) * 60 + h.secondes;
}

export function decoderHeure(valeur: number): HeureLocale {
  let reste = valeur;
  const secondes = reste % 60;
  reste = Math.floor(reste / 60);
  const minutes = reste % 60;
  reste = Math.floor(reste / 60);
  const heures = reste % 24;
  reste = Math.floor(reste / 24);
  const jour = (reste % 31) + 1;
  reste = Math.floor(reste / 31);
  const mois = (reste % 12) + 1;
  return { annee: Math.floor(reste / 12) + 2000, mois, jour, heures, minutes, secondes };
}

/** Écart en secondes entre l'heure de la badgeuse et celle du serveur (positif : la badgeuse avance). */
export function ecartSecondes(badgeuse: HeureLocale, serveur: HeureLocale): number {
  const enMs = (h: HeureLocale) => Date.UTC(h.annee, h.mois - 1, h.jour, h.heures, h.minutes, h.secondes);
  return Math.round((enMs(badgeuse) - enMs(serveur)) / 1000);
}

/** Valeur numérique de 4 octets (heure lue). */
export function lireEntier32(donnees: Uint8Array): number | null {
  if (donnees.length < 4) return null;
  return new DataView(donnees.buffer, donnees.byteOffset, donnees.byteLength).getUint32(0, true);
}

export const entier32 = (valeur: number): Uint8Array => {
  const octets = new Uint8Array(4);
  new DataView(octets.buffer).setUint32(0, valeur, true);
  return octets;
};

/** Nombre d'utilisateurs et de pointages gardés dans la mémoire de la badgeuse. */
export function lireTailles(donnees: Uint8Array): { utilisateurs: number; pointages: number } | null {
  if (donnees.length < 80) return null;
  const vue = new DataView(donnees.buffer, donnees.byteOffset, donnees.byteLength);
  return { utilisateurs: vue.getInt32(4 * 4, true), pointages: vue.getInt32(8 * 4, true) };
}

/** Demande d'une option (« ~SerialNumber »...) : nom terminé par un octet nul. */
export const demandeOption = (nom: string): Uint8Array => new TextEncoder().encode(`${nom}\0`);

/** Texte d'une réponse : jusqu'au premier octet nul, caractères imprimables seulement, 60 au plus. */
export function lireTexte(donnees: Uint8Array): string | null {
  const fin = donnees.indexOf(0);
  const texte = new TextDecoder("latin1").decode(fin === -1 ? donnees : donnees.subarray(0, fin));
  const propre = texte.replace(/[^\x20-\x7e]/g, "").trim().slice(0, 60);
  return propre || null;
}

/** Valeur d'une option (« ~SerialNumber=ABC123 » donne « ABC123 »). */
export function lireOption(donnees: Uint8Array): string | null {
  const texte = lireTexte(donnees);
  if (!texte) return null;
  const position = texte.indexOf("=");
  const valeur = (position === -1 ? texte : texte.slice(position + 1)).trim();
  return valeur || null;
}
