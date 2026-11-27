import "server-only";

import { networkInterfaces } from "node:os";
import { DELAI_SONDAGE_BADGEUSE_MS, FUSEAU_HORAIRE, RESEAUX_PARCOURUS_MAX, SONDAGES_SIMULTANES } from "@/lib/constantes";
import { avecBadgeuse, ErreurBadgeuse, portOuvert, type LiaisonBadgeuse } from "@/lib/donnees/badgeuses-liaison";
import { heureLocale, heureVraisemblable, texteHeureLocale, trierBadgeuses, type EtatBadgeuse } from "@/lib/metier/badgeuses/etat";
import { COMMANDES_ZK, decoderHeure, demandeOption, ecartSecondes, encoderHeure, entier32, lireEntier32, lireOption, lireTailles, lireTexte } from "@/lib/metier/badgeuses/protocole-zk";
import { adressesDuReseau, reseauAParcourir, type ReseauLocal } from "@/lib/metier/badgeuses/reseau";

/** Réseaux privés des cartes réseau du serveur (boucle locale, Internet et VPN exclus). */
export function reseauxDuServeur(): ReseauLocal[] {
  const reseaux = new Map<string, ReseauLocal>();
  for (const adresses of Object.values(networkInterfaces())) {
    for (const carte of adresses ?? []) {
      if (carte.family !== "IPv4" || carte.internal) continue;
      const reseau = reseauAParcourir(carte.address, carte.netmask);
      if (reseau && !reseaux.has(reseau.reseau)) reseaux.set(reseau.reseau, reseau);
    }
  }
  return [...reseaux.values()].slice(0, RESEAUX_PARCOURUS_MAX);
}

const etatVide = (adresse: string, statut: EtatBadgeuse["statut"]): EtatBadgeuse => ({
  adresse,
  statut,
  nom: null,
  numeroSerie: null,
  version: null,
  heureAppareil: null,
  ecartSecondes: null,
  utilisateurs: null,
  pointages: null,
  verifieLe: new Date().toISOString(),
});

/** Lit l'identité et l'état de la badgeuse ; une information qu'un modèle ne donne pas reste vide. */
async function lireInformations(adresse: string, liaison: LiaisonBadgeuse): Promise<EtatBadgeuse> {
  const option = async (nom: string) => {
    const donnees = await liaison.commander(COMMANDES_ZK.lireOption, demandeOption(nom));
    return donnees ? lireOption(donnees) : null;
  };
  const numeroSerie = await option("~SerialNumber");
  const nom = await option("~DeviceName");
  const versionLue = await liaison.commander(COMMANDES_ZK.lireVersion);
  const taillesLues = await liaison.commander(COMMANDES_ZK.lireTailles);
  const heureLue = await liaison.commander(COMMANDES_ZK.lireHeure);
  const tailles = taillesLues ? lireTailles(taillesLues) : null;

  const valeurHeure = heureLue ? lireEntier32(heureLue) : null;
  const heure = valeurHeure === null ? null : decoderHeure(valeurHeure);
  const heureValable = heure && heureVraisemblable(heure) ? heure : null;
  return {
    ...etatVide(adresse, "en_ligne"),
    nom,
    numeroSerie,
    version: versionLue ? lireTexte(versionLue) : null,
    heureAppareil: heureValable ? texteHeureLocale(heureValable) : null,
    ecartSecondes: heureValable ? ecartSecondes(heureValable, heureLocale(new Date(), FUSEAU_HORAIRE)) : null,
    utilisateurs: tailles?.utilisateurs ?? null,
    pointages: tailles?.pointages ?? null,
  };
}

/** Exécute un travail sur la badgeuse ; un échec devient un statut, jamais une exception. */
async function interroger(adresse: string, avant?: (liaison: LiaisonBadgeuse) => Promise<boolean>): Promise<{ etat: EtatBadgeuse; avantReussi: boolean }> {
  try {
    return await avecBadgeuse(adresse, async (liaison) => {
      const avantReussi = avant ? await avant(liaison) : true;
      return { etat: await lireInformations(adresse, liaison), avantReussi };
    });
  } catch (erreur) {
    if (erreur instanceof ErreurBadgeuse) return { etat: etatVide(adresse, erreur.raison), avantReussi: false };
    console.error("Échec de la liaison avec une badgeuse", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { etat: etatVide(adresse, "injoignable"), avantReussi: false };
  }
}

export async function lireEtatBadgeuse(adresse: string): Promise<EtatBadgeuse> {
  return (await interroger(adresse)).etat;
}

/**
 * Synchronisation : règle l'heure de la badgeuse sur celle du serveur (heure de Casablanca)
 * et la remet en service pour qu'elle accepte les pointages, puis relit son état.
 */
export async function synchroniserBadgeuse(adresse: string): Promise<{ etat: EtatBadgeuse; heureReglee: boolean }> {
  const { etat, avantReussi } = await interroger(adresse, async (liaison) => {
    const heure = encoderHeure(heureLocale(new Date(), FUSEAU_HORAIRE));
    const reglee = await liaison.commander(COMMANDES_ZK.reglerHeure, entier32(heure));
    await liaison.commander(COMMANDES_ZK.activer);
    return reglee !== null;
  });
  return { etat, heureReglee: avantReussi };
}

/** Applique une fonction à chaque élément, au plus « simultanes » à la fois. */
async function parLots<T, R>(elements: readonly T[], simultanes: number, travail: (element: T) => Promise<R>): Promise<R[]> {
  const resultats: R[] = new Array(elements.length);
  let suivant = 0;
  const ouvrier = async () => {
    while (suivant < elements.length) {
      const rang = suivant;
      suivant += 1;
      resultats[rang] = await travail(elements[rang]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(simultanes, elements.length) }, ouvrier));
  return resultats;
}

/**
 * Recherche les badgeuses des réseaux du serveur : port 4370 ouvert, puis échange avec
 * l'appareil. Seuls les appareils qui répondent comme une badgeuse sont gardés.
 */
export async function rechercherBadgeuses(): Promise<{ reseaux: ReseauLocal[]; badgeuses: EtatBadgeuse[] }> {
  const reseaux = reseauxDuServeur();
  const adresses = reseaux.flatMap(adressesDuReseau);
  const ouvertes = (await parLots(adresses, SONDAGES_SIMULTANES, async (adresse) => ((await portOuvert(adresse, DELAI_SONDAGE_BADGEUSE_MS)) ? adresse : null))).filter(
    (adresse): adresse is string => adresse !== null,
  );
  const etats = await parLots(ouvertes, SONDAGES_SIMULTANES, lireEtatBadgeuse);
  const badgeuses = etats.filter((etat) => etat.statut === "en_ligne" || etat.statut === "protegee");
  return { reseaux, badgeuses: trierBadgeuses(badgeuses) };
}
