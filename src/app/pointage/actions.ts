"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { notifier } from "@/lib/actions/notifier";
import { CHEMIN_DETAIL_JOUR, FUSEAU_HORAIRE, POINTAGES_DISTANCE_PAR_MINUTE } from "@/lib/constantes";
import { insererPointageDistance, lireEmployePourPointage } from "@/lib/donnees/pointage-distance";
import { obtenirEmployeConnecte } from "@/lib/donnees/session";
import { formaterHeure } from "@/lib/formats";
import { jourDansFuseau } from "@/lib/metier/dates";
import { creerLimiteur } from "@/lib/metier/limiteur";
import { detecterAppareil, etatsAutorises, photoPointageValide } from "@/lib/metier/pointage-distance";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import { TEXTES_NOTIFICATIONS } from "@/lib/textes/notifications";
import { TEXTES_POINTAGE_DISTANCE } from "@/lib/textes/pointage-distance";
import { lireEtatPointage, lireFichierPhoto, lirePosition } from "@/lib/validation/pointage-distance";
import type { Resultat } from "@/types";

const { erreurs } = TEXTES_POINTAGE_DISTANCE;
const limiteParEmploye = creerLimiteur(POINTAGES_DISTANCE_PAR_MINUTE, 60_000);

/**
 * Pointage à distance de l'employé connecté. Identité lue dans la session ; autorisation,
 * appareil, position et photo revérifiés ici. L'heure est celle du serveur.
 */
export async function pointerADistance(formulaire: FormData): Promise<Resultat<{ message: string }>> {
  const utilisateur = await obtenirEmployeConnecte();
  if (!limiteParEmploye.autoriser(utilisateur.employeId, Date.now())) return { ok: false, erreur: erreurs.tropRapide };

  const employe = await lireEmployePourPointage(utilisateur.employeId);
  if (!employe?.estAutorise) return { ok: false, erreur: erreurs.droits };
  const appareil = detecterAppareil((await headers()).get("user-agent") ?? "");
  if (!employe.appareils.includes(appareil)) return { ok: false, erreur: erreurs.appareil };

  const etat = lireEtatPointage(formulaire);
  if (!etat) return { ok: false, erreur: erreurs.etat };
  // Seuls les types de pointage accordés sur la fiche (présence, mission, heures sup.) sont acceptés.
  if (!etatsAutorises(employe.droits).includes(etat)) return { ok: false, erreur: erreurs.etatNonAccorde };
  // Minimisation : position et photo ne sont gardées que si la fiche de l'employé les exige.
  const position = employe.exigePosition ? lirePosition(formulaire) : null;
  if (employe.exigePosition && !position) return { ok: false, erreur: erreurs.position };
  let photo: Buffer | null = null;
  if (employe.exigePhoto) {
    const fichier = lireFichierPhoto(formulaire);
    if (!fichier) return { ok: false, erreur: erreurs.photo };
    photo = Buffer.from(await fichier.arrayBuffer());
    if (!photoPointageValide(photo)) return { ok: false, erreur: erreurs.photoInvalide };
  }

  let horodatage: Date | null;
  try {
    horodatage = await insererPointageDistance({ employeId: utilisateur.employeId, utilisateurId: utilisateur.id, etat, appareil, position, photo });
  } catch (erreur) {
    console.error("Échec d'un pointage à distance", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return { ok: false, erreur: erreurs.echec };
  }
  if (!horodatage) return { ok: false, erreur: erreurs.doublon };

  // Journal d'audit sans position ni photo.
  console.info("Pointage à distance enregistré", { identifiant: utilisateur.identifiant, etat, appareil });
  // Cloche et historique : qui (l'employé, auteur lu dans la session), quoi, depuis quel appareil ; lien vers son Détail jour.
  const libelleEtat = TEXTES_EXCEPTIONS.pointages.etats[etat];
  const libelle = TEXTES_NOTIFICATIONS.libellePointageDistance(libelleEtat, TEXTES_NOTIFICATIONS.appareils[appareil], position !== null, photo !== null);
  const lien = `${CHEMIN_DETAIL_JOUR}?employe=${utilisateur.employeId}&date=${jourDansFuseau(horodatage, FUSEAU_HORAIRE)}`;
  await notifier("pointage_distance", "creation", libelle, lien);
  refresh();
  return { ok: true, donnees: { message: TEXTES_POINTAGE_DISTANCE.reussite(libelleEtat, formaterHeure(horodatage)) } };
}
