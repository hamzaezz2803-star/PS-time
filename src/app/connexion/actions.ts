"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import {
  FENETRE_TENTATIVES_SECONDES,
  FUSEAU_HORAIRE,
  TENTATIVES_CONNEXION_MAX,
  TENTATIVES_INSTALLATION_MAX_PAR_JOUR,
  UN_JOUR_MILLISECONDES,
} from "@/lib/constantes";
import { indexEnDoublon } from "@/lib/donnees/erreurs";
import { creerJetonInstallation, creerPremierAdministrateur, installationTerminee } from "@/lib/donnees/installation";
import { creerLimiteur } from "@/lib/metier/limiteur";
import { motDePasseDuJour } from "@/lib/metier/mot-de-passe-du-jour";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { validerPremierCompte } from "@/lib/validation/connexion";
import type { EtatPremierCompte, ResultatCodeInstallation } from "@/types";

const { erreurs } = TEXTES_CONNEXION;
const textesInstallation = TEXTES_CONNEXION.installation;

// Même limite que la connexion normale par adresse IP, plus un plafond commun à toutes les adresses.
const limiteParAdresse = creerLimiteur(TENTATIVES_CONNEXION_MAX, FENETRE_TENTATIVES_SECONDES * 1000);
const limiteGlobale = creerLimiteur(TENTATIVES_INSTALLATION_MAX_PAR_JOUR, UN_JOUR_MILLISECONDES);

async function adresseIp(): Promise<string> {
  const entetes = await headers();
  return entetes.get("x-forwarded-for")?.split(",")[0]?.trim() || entetes.get("x-real-ip") || "inconnue";
}

/** Comparaison en temps constant : la durée de la réponse ne révèle pas les chiffres justes. */
function codeCorrect(saisi: string): boolean {
  const attendu = Buffer.from(motDePasseDuJour(new Date(), FUSEAU_HORAIRE));
  const recu = Buffer.from(saisi);
  return recu.length === attendu.length && timingSafeEqual(recu, attendu);
}

/**
 * Connexion « pstime » + mot de passe du jour. Valable seulement tant qu'aucun utilisateur
 * n'existe : renvoie alors un jeton à usage unique pour créer le premier administrateur.
 * Aucune session n'est ouverte. Une erreur reste vague (même message qu'un mauvais mot de passe).
 */
export async function verifierCodeInstallation(motDePasse: string): Promise<ResultatCodeInstallation> {
  const maintenant = Date.now();
  if (!limiteParAdresse.autoriser(await adresseIp(), maintenant) || !limiteGlobale.autoriser("toutes", maintenant)) {
    return { ok: false, message: erreurs.tropDeTentatives };
  }
  if (typeof motDePasse !== "string" || !codeCorrect(motDePasse)) {
    return { ok: false, message: erreurs.identifiantsInvalides };
  }
  try {
    if (await installationTerminee()) return { ok: false, message: erreurs.identifiantsInvalides };
    const jeton = await creerJetonInstallation();
    console.info("Installation : code du jour accepté, création du premier compte ouverte");
    return { ok: true, jeton };
  } catch (erreur) {
    console.error("Échec de la vérification du code d'installation", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { ok: false, message: erreurs.serviceIndisponible };
  }
}

/** Crée le premier super administrateur (fenêtre ouverte après la connexion « pstime »). */
export async function creerPremierCompte(_etat: EtatPremierCompte, formulaire: FormData): Promise<EtatPremierCompte> {
  const validation = validerPremierCompte(formulaire);
  if (!validation.ok) {
    const { jeton, ...erreursChamps } = validation.erreursChamps ?? {};
    return jeton ? { message: textesInstallation.erreurs.expire } : { erreursChamps };
  }
  const { jeton, identifiant, nouveau } = validation.donnees;

  try {
    if (!(await creerPremierAdministrateur(jeton, identifiant, nouveau))) {
      return { message: textesInstallation.erreurs.expire };
    }
  } catch (erreur) {
    if (indexEnDoublon(erreur) !== null) return { message: textesInstallation.erreurs.expire };
    console.error("Échec de la création du premier compte", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { message: textesInstallation.erreurs.echec };
  }
  // Journal d'audit : création d'un compte administrateur (jamais le mot de passe).
  console.info("Installation : premier super administrateur créé", { identifiant });
  return { identifiantCree: identifiant };
}
