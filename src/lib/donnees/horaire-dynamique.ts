import "server-only";

import { and, asc, eq, gte, inArray, lt, notInArray } from "drizzle-orm";
import { COULEUR_REGLE_DEFAUT, COULEURS_REGLE, FUSEAU_HORAIRE, LIMITE_LISTE_PROGRAMME, UN_JOUR_MILLISECONDES, type CouleurRegle } from "@/lib/constantes";
import { jourEtMinuteLocaux } from "@/lib/metier/dates";
import { joursVersTexte, premiersPointages, regleEnConflit, texteVersJours, type RegleHoraire } from "@/lib/metier/horaire-dynamique";
import type { DonneesHoraireDynamique } from "@/lib/metier/planning-jour";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_HORAIRE_DYNAMIQUE } from "@/lib/textes/horaire-dynamique";
import type { DonneesRegleHoraire } from "@/lib/validation/regle-horaire";
import type { RegleHoraireListe } from "@/types";
import { obtenirBase, type Base } from "./base";
import { employes, pointages, profilsHoraires, reglesHoraires } from "./schema";

type Transaction = Parameters<Parameters<Base["transaction"]>[0]>[0];

const colonnesRegle = {
  id: reglesHoraires.id,
  debut: reglesHoraires.debutMinutes,
  fin: reglesHoraires.finMinutes,
  joursSemaine: reglesHoraires.joursSemaine,
  profilId: reglesHoraires.profilId,
  estActif: reglesHoraires.estActif,
};

const versRegle = ({ joursSemaine, ...regle }: { joursSemaine: string } & Omit<RegleHoraire, "jours">): RegleHoraire => ({
  ...regle,
  jours: texteVersJours(joursSemaine),
});

/** Règles triées par heure de début, avec le nom du profil appliqué. */
export async function listerRegles(): Promise<RegleHoraireListe[]> {
  const lignes = await obtenirBase()
    .select({ ...colonnesRegle, profilNom: profilsHoraires.nom, profilCode: profilsHoraires.code, couleur: reglesHoraires.couleur })
    .from(reglesHoraires)
    .innerJoin(profilsHoraires, eq(profilsHoraires.id, reglesHoraires.profilId))
    .orderBy(asc(reglesHoraires.debutMinutes), asc(reglesHoraires.finMinutes))
    .limit(LIMITE_LISTE_PROGRAMME);
  return lignes.map(({ profilNom, profilCode, couleur, ...ligne }) => {
    const regle = versRegle(ligne);
    const nom = TEXTES_HORAIRE_DYNAMIQUE.nomRegle(minutesVersHeure(regle.debut), minutesVersHeure(regle.fin), profilNom);
    return { ...regle, nom, profilNom, profilCode, couleur: lireCouleurRegle(couleur) };
  });
}

/** Couleur lue en base, ramenée à la palette (la contrainte `check` la garantit déjà). */
const lireCouleurRegle = (valeur: string): CouleurRegle => COULEURS_REGLE.find((couleur) => couleur === valeur) ?? COULEUR_REGLE_DEFAUT;

/** Couleur de chaque règle, par identifiant (pastilles du rapport des présences). */
export async function couleursDesRegles(): Promise<Map<string, CouleurRegle>> {
  const lignes = await obtenirBase().select({ id: reglesHoraires.id, couleur: reglesHoraires.couleur }).from(reglesHoraires);
  return new Map(lignes.map((ligne) => [ligne.id, lireCouleurRegle(ligne.couleur)]));
}

/**
 * Toutes les règles, verrouillées jusqu'à la fin de la transaction : en InnoDB (lecture
 * répétable), ce verrou bloque aussi les insertions simultanées, donc deux règles qui se
 * chevauchent ne peuvent pas être enregistrées en même temps.
 */
async function reglesVerrouillees(transaction: Transaction): Promise<RegleHoraire[]> {
  const lignes = await transaction.select(colonnesRegle).from(reglesHoraires).for("update");
  return lignes.map(versRegle);
}

export type ResultatRegle = { ok: true; id: string } | { ok: false; erreur: "introuvable" | "profil" | "chevauchement" };

/** Crée (sans `id`) ou modifie une règle : profil de travail existant, sans chevauchement avec une règle active. */
export async function enregistrerRegle(id: string | null, donnees: DonneesRegleHoraire): Promise<ResultatRegle> {
  return obtenirBase().transaction(async (transaction) => {
    const [profil] = await transaction
      .select({ id: profilsHoraires.id })
      .from(profilsHoraires)
      .where(and(eq(profilsHoraires.id, donnees.profilId), eq(profilsHoraires.type, "travail")))
      .for("update");
    if (!profil) return { ok: false, erreur: "profil" };

    const existantes = await reglesVerrouillees(transaction);
    if (id && !existantes.some((regle) => regle.id === id)) return { ok: false, erreur: "introuvable" };
    const idRegle = id ?? crypto.randomUUID();
    if (regleEnConflit({ id: idRegle, ...donnees }, existantes)) return { ok: false, erreur: "chevauchement" };

    const valeurs = {
      debutMinutes: donnees.debut,
      finMinutes: donnees.fin,
      joursSemaine: joursVersTexte(donnees.jours),
      profilId: donnees.profilId,
      estActif: donnees.estActif,
      couleur: donnees.couleur,
    };
    if (id) await transaction.update(reglesHoraires).set(valeurs).where(eq(reglesHoraires.id, id));
    else await transaction.insert(reglesHoraires).values({ id: idRegle, ...valeurs });
    return { ok: true, id: idRegle };
  });
}

/** Active ou désactive une règle ; l'activation est refusée si elle chevauche une règle active. */
export async function changerEtatRegle(id: string, estActif: boolean): Promise<ResultatRegle> {
  return obtenirBase().transaction(async (transaction) => {
    const existantes = await reglesVerrouillees(transaction);
    const regle = existantes.find((element) => element.id === id);
    if (!regle) return { ok: false, erreur: "introuvable" };
    if (estActif && regleEnConflit({ ...regle, estActif }, existantes)) return { ok: false, erreur: "chevauchement" };
    await transaction.update(reglesHoraires).set({ estActif }).where(eq(reglesHoraires.id, id));
    return { ok: true, id };
  });
}

export async function supprimerRegleParId(id: string): Promise<void> {
  await obtenirBase().delete(reglesHoraires).where(eq(reglesHoraires.id, id));
}

/** Règles actives (celles qui reconnaissent un horaire). */
export async function listerReglesActives(): Promise<RegleHoraire[]> {
  const lignes = await obtenirBase().select(colonnesRegle).from(reglesHoraires).where(eq(reglesHoraires.estActif, true));
  return lignes.map(versRegle);
}

/** Identifiants des employés qui ont l'horaire dynamique. */
export async function listerEmployesHoraireDynamique(): Promise<string[]> {
  const lignes = await obtenirBase().select({ id: employes.id }).from(employes).where(eq(employes.horaireDynamique, true));
  return lignes.map((ligne) => ligne.id);
}

/**
 * Fixe la liste des employés en horaire dynamique (les autres le perdent), dans une transaction.
 * Faux si un des employés n'existe pas : rien n'est alors modifié.
 */
export async function enregistrerEmployesHoraireDynamique(ids: string[]): Promise<boolean> {
  return obtenirBase().transaction(async (transaction) => {
    if (ids.length > 0) {
      const trouves = await transaction.select({ id: employes.id }).from(employes).where(inArray(employes.id, ids)).for("update");
      if (trouves.length !== ids.length) return false;
      await transaction.update(employes).set({ horaireDynamique: true }).where(inArray(employes.id, ids));
    }
    await transaction
      .update(employes)
      .set({ horaireDynamique: false })
      .where(ids.length > 0 ? and(eq(employes.horaireDynamique, true), notInArray(employes.id, ids)) : eq(employes.horaireDynamique, true));
    return true;
  });
}

/**
 * Ce qu'il faut à l'horaire dynamique pour évaluer ces pointages : les règles, et le premier
 * pointage du jour (heure de Casablanca) de chaque employé concerné qui l'a activé. Les instants
 * donnés comptent aussi (un pointage en cours d'enregistrement peut être le premier du jour).
 */
export async function chargerHoraireDynamique(
  instants: { employeId: string; horodatage: Date }[],
): Promise<DonneesHoraireDynamique | undefined> {
  const ids = [...new Set(instants.map((instant) => instant.employeId))];
  if (ids.length === 0) return undefined;
  const base = obtenirBase();
  const [actifs, lignesRegles] = await Promise.all([
    base.select({ id: employes.id }).from(employes).where(and(inArray(employes.id, ids), eq(employes.horaireDynamique, true))),
    listerReglesActives(),
  ]);
  if (actifs.length === 0 || lignesRegles.length === 0) return undefined;

  const idsActifs = actifs.map((actif) => actif.id);
  const concernes = instants.filter((instant) => idsActifs.includes(instant.employeId));
  const temps = concernes.map((instant) => instant.horodatage.getTime());
  // Un jour de marge de chaque côté couvre le décalage entre UTC et l'heure locale.
  const debut = new Date(Math.min(...temps) - UN_JOUR_MILLISECONDES);
  const fin = new Date(Math.max(...temps) + UN_JOUR_MILLISECONDES);
  const enBase = await base
    .select({ employeId: pointages.employeId, horodatage: pointages.horodatage })
    .from(pointages)
    .where(and(inArray(pointages.employeId, idsActifs), gte(pointages.horodatage, debut), lt(pointages.horodatage, fin)));

  const locaux = [...enBase, ...concernes].map((pointage) => ({ employeId: pointage.employeId, ...jourEtMinuteLocaux(pointage.horodatage, FUSEAU_HORAIRE) }));
  return { regles: lignesRegles, premiersPointages: premiersPointages(locaux) };
}
