"use server";

import { tracer } from "@/lib/actions/notifier";
import { ACTIONS_BADGEUSE_PAR_MINUTE, CHEMIN_APPAREILS, RECHERCHES_BADGEUSES_PAR_MINUTE } from "@/lib/constantes";
import { lireEtatBadgeuse, rechercherBadgeuses, synchroniserBadgeuse } from "@/lib/donnees/badgeuses";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import type { EtatBadgeuse } from "@/lib/metier/badgeuses/etat";
import type { ReseauLocal } from "@/lib/metier/badgeuses/reseau";
import { creerLimiteur } from "@/lib/metier/limiteur";
import { TEXTES_APPAREILS } from "@/lib/textes/appareils";
import { schemaAdresseBadgeuse } from "@/lib/validation/badgeuses";
import type { Resultat } from "@/types";

const { recherche, ajout, messages, droits } = TEXTES_APPAREILS;
// Une recherche parcourt tout le réseau : peu par minute, pour toute l'installation.
const limiteRecherches = creerLimiteur(RECHERCHES_BADGEUSES_PAR_MINUTE, 60_000);
const limiteActions = creerLimiteur(ACTIONS_BADGEUSE_PAR_MINUTE, 60_000);

/** Super administrateur seulement : vérifié dans chaque action, jamais seulement dans la page. */
async function verifierAcces(): Promise<{ identifiant: string } | null> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  return utilisateur.estSuperAdmin ? { identifiant: utilisateur.identifiant } : null;
}

export async function rechercherBadgeusesDuReseau(): Promise<Resultat<{ reseaux: ReseauLocal[]; badgeuses: EtatBadgeuse[] }>> {
  const utilisateur = await verifierAcces();
  if (!utilisateur) return { ok: false, erreur: droits };
  if (!limiteRecherches.autoriser("installation", Date.now())) return { ok: false, erreur: recherche.tropRapide };
  try {
    const resultat = await rechercherBadgeuses();
    console.info("Recherche de badgeuses", { identifiant: utilisateur.identifiant, reseaux: resultat.reseaux.length, trouvees: resultat.badgeuses.length });
    return { ok: true, donnees: resultat };
  } catch (erreur) {
    console.error("Échec de la recherche de badgeuses", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { ok: false, erreur: recherche.echec };
  }
}

export async function verifierBadgeuse(adresse: unknown): Promise<Resultat<EtatBadgeuse>> {
  const utilisateur = await verifierAcces();
  if (!utilisateur) return { ok: false, erreur: droits };
  const lue = schemaAdresseBadgeuse.safeParse(adresse);
  if (!lue.success) return { ok: false, erreur: ajout.invalide };
  if (!limiteActions.autoriser(utilisateur.identifiant, Date.now())) return { ok: false, erreur: messages.tropRapide };
  return { ok: true, donnees: await lireEtatBadgeuse(lue.data) };
}

export async function synchroniserUneBadgeuse(adresse: unknown): Promise<Resultat<{ etat: EtatBadgeuse; message: string; reussi: boolean }>> {
  const utilisateur = await verifierAcces();
  if (!utilisateur) return { ok: false, erreur: droits };
  const lue = schemaAdresseBadgeuse.safeParse(adresse);
  if (!lue.success) return { ok: false, erreur: ajout.invalide };
  if (!limiteActions.autoriser(utilisateur.identifiant, Date.now())) return { ok: false, erreur: messages.tropRapide };

  const { etat, heureReglee } = await synchroniserBadgeuse(lue.data);
  if (etat.statut !== "en_ligne") return { ok: true, donnees: { etat, reussi: false, message: TEXTES_APPAREILS.explicationsStatut[etat.statut] || messages.echecSynchro } };
  if (!heureReglee) return { ok: true, donnees: { etat, reussi: false, message: messages.heureRefusee } };

  console.info("Badgeuse synchronisée", { identifiant: utilisateur.identifiant, adresse: etat.adresse });
  await tracer("modification", "badgeuse", TEXTES_APPAREILS.historique(etat.adresse, etat.numeroSerie), CHEMIN_APPAREILS);
  const heure = etat.heureAppareil ? TEXTES_APPAREILS.heureLisible(etat.heureAppareil) : "";
  return { ok: true, donnees: { etat, reussi: true, message: messages.synchronisee(heure) } };
}
