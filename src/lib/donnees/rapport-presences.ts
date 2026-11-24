import "server-only";

import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { COULEUR_REGLE_DEFAUT, FUSEAU_HORAIRE, RAPPORT_LIGNES_MAX, UN_JOUR_MILLISECONDES } from "@/lib/constantes";
import { idsDescendants } from "@/lib/metier/arbre";
import { jourEtMinuteLocaux } from "@/lib/metier/dates";
import { lignesRapport } from "@/lib/metier/rapport-presences";
import type { RechercheRapport } from "@/lib/validation/rapport-presences";
import type { LigneRapportPresence } from "@/types";
import { obtenirBase } from "./base";
import { listerDepartements } from "./departements";
import { couleursDesRegles, listerReglesActives } from "./horaire-dynamique";
import { listerProfils } from "./profils-horaires";
import { departements, employes, pointages } from "./schema";

export type Rapport = { lignes: LigneRapportPresence[]; estTronque: boolean };

/** Employés en horaire dynamique, du département choisi (sous-départements compris) ou de tous. */
async function employesConcernes(departementId: string | null) {
  const filtreDepartement = departementId ? [departementId, ...idsDescendants(await listerDepartements(), departementId)] : null;
  return obtenirBase()
    .select({ id: employes.id, matricule: employes.matricule, prenom: employes.prenom, nom: employes.nom, departement: departements.nom })
    .from(employes)
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .where(and(eq(employes.horaireDynamique, true), filtreDepartement ? inArray(employes.departementId, filtreDepartement) : undefined));
}

/**
 * Rapport des présences : pour chaque employé en horaire dynamique et chaque jour pointé de la
 * période, son premier pointage (heure de Casablanca) et l'horaire reconnu par les règles actives.
 */
export async function chargerRapport(recherche: RechercheRapport): Promise<Rapport> {
  const concernes = await employesConcernes(recherche.departementId);
  if (concernes.length === 0) return { lignes: [], estTronque: false };

  // Un jour de marge de chaque côté : le jour local peut différer du jour UTC.
  const depuis = new Date(Date.parse(`${recherche.du}T00:00:00Z`) - UN_JOUR_MILLISECONDES);
  const jusqua = new Date(Date.parse(`${recherche.au}T00:00:00Z`) + 2 * UN_JOUR_MILLISECONDES);
  const [lignesPointages, regles, profils, couleurs] = await Promise.all([
    obtenirBase()
      .select({ employeId: pointages.employeId, horodatage: pointages.horodatage })
      .from(pointages)
      .where(and(inArray(pointages.employeId, concernes.map((employe) => employe.id)), gte(pointages.horodatage, depuis), lt(pointages.horodatage, jusqua))),
    listerReglesActives(),
    listerProfils(),
    couleursDesRegles(),
  ]);

  const locaux = lignesPointages
    .map((pointage) => ({ employeId: pointage.employeId, ...jourEtMinuteLocaux(pointage.horodatage, FUSEAU_HORAIRE) }))
    .filter((pointage) => pointage.jour >= recherche.du && pointage.jour <= recherche.au);
  const parEmploye = new Map(concernes.map((employe) => [employe.id, employe]));
  const parProfil = new Map(profils.map((profil) => [profil.id, { code: profil.code, nom: profil.nom }]));

  const toutes = lignesRapport(locaux, regles).flatMap((ligne): LigneRapportPresence[] => {
    const employe = parEmploye.get(ligne.employeId);
    if (!employe) return [];
    const profil = ligne.profilId ? parProfil.get(ligne.profilId) : undefined;
    return [{
      employeId: employe.id,
      matricule: employe.matricule,
      nomComplet: `${employe.prenom} ${employe.nom}`,
      departement: employe.departement,
      jour: ligne.jour,
      minutes: ligne.minutes,
      profil: profil ? { ...profil, couleur: (ligne.regleId && couleurs.get(ligne.regleId)) || COULEUR_REGLE_DEFAUT } : null,
    }];
  });
  return { lignes: toutes.slice(0, RAPPORT_LIGNES_MAX), estTronque: toutes.length > RAPPORT_LIGNES_MAX };
}
