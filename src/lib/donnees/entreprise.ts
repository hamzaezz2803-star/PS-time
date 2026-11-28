import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { CHEMIN_LOGO_ENTREPRISE } from "@/lib/constantes";
import { TEXTES_ENTREPRISE } from "@/lib/textes/entreprise";
import type { DonneesEntreprise } from "@/lib/validation/entreprise";
import { obtenirBase } from "./base";
import type { ChangementPhoto } from "./photos-employes";
import { entreprise } from "./schema";

/** Étiquette du cache des informations de l'entreprise, vidée à l'enregistrement. */
export const ETIQUETTE_ENTREPRISE = "entreprise";

/** Informations enregistrées, et version du logo (date de son dernier changement, en ms) ou null sans logo. */
export type FicheEntreprise = DonneesEntreprise & { logoVersion: number | null };

/** Ce qu'il faut pour afficher le logo : adresse (qui change avec le logo), texte de remplacement et nom de l'entreprise. */
export type LogoAffiche = { src: string; alt: string; nom: string };

/**
 * Informations de l'entreprise, sans le contenu du logo. Lues sur toutes les pages connectées
 * et sur la connexion : gardées en cache et relues aussitôt après un changement. null sans fiche.
 */
export async function lireEntreprise(): Promise<FicheEntreprise | null> {
  "use cache";
  cacheTag(ETIQUETTE_ENTREPRISE);
  cacheLife("hours");
  const [ligne] = await obtenirBase()
    .select({
      nom: entreprise.nom,
      adresse: entreprise.adresse,
      telephone: entreprise.telephone,
      email: entreprise.email,
      ice: entreprise.ice,
      registreCommerce: entreprise.registreCommerce,
      identifiantFiscal: entreprise.identifiantFiscal,
      numeroCnss: entreprise.numeroCnss,
      logoModifieLe: entreprise.logoModifieLe,
    })
    .from(entreprise)
    .limit(1);
  if (!ligne) return null;
  const { logoModifieLe, ...donnees } = ligne;
  return { ...donnees, logoVersion: logoModifieLe ? logoModifieLe.getTime() : null };
}

/** Logo à afficher (connexion, barre de navigation), ou null s'il n'y en a pas. Base injoignable : pas de logo. */
export async function lireLogoAffiche(): Promise<LogoAffiche | null> {
  try {
    const fiche = await lireEntreprise();
    if (!fiche?.logoVersion) return null;
    return { src: `${CHEMIN_LOGO_ENTREPRISE}?v=${fiche.logoVersion}`, alt: TEXTES_ENTREPRISE.altLogo(fiche.nom), nom: fiche.nom };
  } catch (erreur) {
    console.error("Échec de la lecture du logo de l'entreprise", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return null;
  }
}

/** Contenu du logo (route publique), ou null s'il n'y en a pas. */
export async function lireContenuLogo(): Promise<{ typeMime: string; contenu: Buffer; version: number } | null> {
  const [ligne] = await obtenirBase()
    .select({ typeMime: entreprise.logoTypeMime, contenu: entreprise.logoContenu, modifieLe: entreprise.logoModifieLe })
    .from(entreprise)
    .limit(1);
  if (!ligne?.typeMime || !ligne.contenu || !ligne.modifieLe) return null;
  return { typeMime: ligne.typeMime, contenu: ligne.contenu, version: ligne.modifieLe.getTime() };
}

/** Colonnes du logo selon le changement demandé (rien pour « garder »). */
function colonnesLogo(changement: ChangementPhoto) {
  if (changement.action === "garder") return {};
  if (changement.action === "retirer") return { logoTypeMime: null, logoContenu: null, logoTailleOctets: null, logoModifieLe: null };
  const { type, octets } = changement.photo;
  return { logoTypeMime: type, logoContenu: octets, logoTailleOctets: octets.length, logoModifieLe: new Date() };
}

/** Crée ou met à jour l'unique fiche de l'entreprise (une seule requête : tout réussit ou rien). */
export async function enregistrerEntreprise(donnees: DonneesEntreprise, logo: ChangementPhoto, auteurId: string): Promise<void> {
  const valeurs = { ...donnees, ...colonnesLogo(logo), modifiePar: auteurId };
  await obtenirBase()
    .insert(entreprise)
    .values({ ...valeurs, estUnique: true })
    .onConflictDoUpdate({ target: entreprise.estUnique, set: valeurs });
}
