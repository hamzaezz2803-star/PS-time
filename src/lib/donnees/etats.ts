import "server-only";

import { and, asc, desc, eq, gte, inArray, ilike, lt, lte, or, type SQL } from "drizzle-orm";
import { FUSEAU_HORAIRE, RAPPORT_LIGNES_MAX, STATISTIQUES_EMPLOYES_MAX, UN_JOUR_MILLISECONDES } from "@/lib/constantes";
import { decrirePeriode } from "@/components/absences/periode-absence";
import { formaterJour } from "@/lib/formats";
import { idsDescendants } from "@/lib/metier/arbre";
import { jourEtMinuteLocaux } from "@/lib/metier/dates";
import { etatSolde } from "@/lib/metier/droits-conges";
import { joursDeLaSaisie, lignesPresences, type Etat } from "@/lib/metier/etats";
import { formaterDuree, minutesVersHeure } from "@/lib/metier/programme";
import { motifContient } from "@/lib/metier/recherche";
import { TEXTES_DROITS_CONGES } from "@/lib/textes/droits-conges";
import { TEXTES_ETATS } from "@/lib/textes/etats";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import type { RechercheEtat } from "@/lib/validation/etats";
import { obtenirBase } from "./base";
import { listerDepartements } from "./departements";
import { calculerSoldes, COLONNES_SOLDE, lireUniteDroit } from "./droits-conges-soldes";
import { departements, droitsConges, employes, evenements, evenementsEmployes, pointages, utilisateurs } from "./schema";
import { chargerJourneesEquipe } from "./statistiques-presence";

/** Lignes d'un état, déjà mises en texte (mêmes valeurs à l'écran, en Excel et en PDF). */
export type TableauEtat = { lignes: string[][]; estTronque: boolean };

const { valeurs } = TEXTES_ETATS;
const duree = (minutes: number | null) => (minutes === null ? "" : formaterDuree(minutes));
const heure = (minutes: number | null) => (minutes === null ? "" : minutesVersHeure(minutes));
const nombre = (valeur: number) => String(valeur).replace(".", ",");
const limiter = (lignes: string[][]): TableauEtat => ({ lignes: lignes.slice(0, RAPPORT_LIGNES_MAX), estTronque: lignes.length > RAPPORT_LIGNES_MAX });

/** Condition SQL (paramétrée) des employés retenus : département (sous-départements compris), nom ou matricule. */
async function conditionEmployes(recherche: RechercheEtat): Promise<SQL | undefined> {
  const conditions: (SQL | undefined)[] = [];
  if (recherche.departementId) {
    conditions.push(inArray(employes.departementId, [recherche.departementId, ...idsDescendants(await listerDepartements(), recherche.departementId)]));
  }
  if (recherche.employe) {
    const motif = motifContient(recherche.employe);
    conditions.push(or(ilike(employes.nom, motif), ilike(employes.prenom, motif), ilike(employes.matricule, motif)));
  }
  return and(...conditions);
}

/** Présences et retards : une ligne par employé et par jour attendu, pointé ou avec un événement. */
async function etatPresences(recherche: RechercheEtat, maintenant: { jour: string; minute: number }): Promise<TableauEtat> {
  const { employes: equipe, estTronque } = await chargerJourneesEquipe(recherche.du, recherche.au, await conditionEmployes(recherche));
  const lignes = lignesPresences(equipe, maintenant).map(({ employe, resume, statut }) => [
    employe.matricule,
    employe.nomComplet,
    employe.departement,
    formaterJour(resume.jour),
    resume.profilCode ?? valeurs.repos,
    heure(resume.entree),
    heure(resume.sortie),
    duree(resume.travailleMinutes),
    duree(resume.retardMinutes),
    valeurs.statuts[statut],
    resume.evenement ? `${resume.evenement.code} · ${resume.evenement.nom}` : "",
  ]);
  const tableau = limiter(lignes);
  return { ...tableau, estTronque: tableau.estTronque || estTronque };
}

/** Absences et événements : chaque saisie qui touche la période, avec ses jours prévus et validés. */
async function etatEvenements(recherche: RechercheEtat): Promise<TableauEtat> {
  const condition = await conditionEmployes(recherche);
  const [saisies, journees] = await Promise.all([
    obtenirBase()
      .select({
        id: evenementsEmployes.id,
        employeId: employes.id,
        code: evenements.code,
        nom: evenements.nom,
        type: evenements.type,
        debut: evenementsEmployes.dateDebut,
        fin: evenementsEmployes.dateFin,
        debutMinutes: evenementsEmployes.debutMinutes,
        finMinutes: evenementsEmployes.finMinutes,
        remarque: evenementsEmployes.remarque,
      })
      .from(evenementsEmployes)
      .innerJoin(employes, eq(employes.id, evenementsEmployes.employeId))
      .innerJoin(evenements, eq(evenements.id, evenementsEmployes.evenementId))
      .where(and(condition, lte(evenementsEmployes.dateDebut, recherche.au), gte(evenementsEmployes.dateFin, recherche.du)))
      .orderBy(desc(evenementsEmployes.dateDebut), asc(employes.nom))
      .limit(RAPPORT_LIGNES_MAX + 1),
    chargerJourneesEquipe(recherche.du, recherche.au, condition),
  ]);
  const parId = new Map(journees.employes.map((employe) => [employe.id, employe]));
  const lignes = saisies.flatMap((saisie) => {
    const employe = parId.get(saisie.employeId);
    if (!employe) return [];
    const jours = saisie.debutMinutes === null ? joursDeLaSaisie(employe, saisie) : null;
    return [[
      employe.matricule,
      employe.nomComplet,
      employe.departement,
      saisie.code,
      saisie.nom,
      valeurs.types[saisie.type === "presence" ? "presence" : "absence"],
      decrirePeriode(saisie),
      jours ? String(jours.prevus) : valeurs.enHeures,
      jours ? String(jours.valides) : "",
      saisie.remarque ?? "",
    ]];
  });
  return { ...limiter(lignes), estTronque: saisies.length > RAPPORT_LIGNES_MAX || journees.estTronque };
}

/** Congés et soldes : droits valables sur la période, avec leur bilan calculé (jamais stocké). */
async function etatConges(recherche: RechercheEtat, aujourdhui: string): Promise<TableauEtat> {
  const droits = await obtenirBase()
    .select({ ...COLONNES_SOLDE, matricule: employes.matricule, prenom: employes.prenom, nom: employes.nom, departement: departements.nom, code: evenements.code, evenement: evenements.nom })
    .from(droitsConges)
    .innerJoin(employes, eq(employes.id, droitsConges.employeId))
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .innerJoin(evenements, eq(evenements.id, droitsConges.evenementId))
    .where(and(await conditionEmployes(recherche), lte(droitsConges.dateDebut, recherche.au), gte(droitsConges.dateFin, recherche.du)))
    .orderBy(asc(employes.nom), asc(employes.prenom), asc(evenements.code), desc(droitsConges.dateDebut))
    .limit(STATISTIQUES_EMPLOYES_MAX);
  const soldes = await calculerSoldes(droits, aujourdhui);
  const lignes = droits.map((droit, rang) => {
    const bilan = soldes[rang];
    return [
      droit.matricule,
      `${droit.prenom} ${droit.nom}`,
      droit.departement,
      droit.code,
      droit.evenement,
      valeurs.duAu(formaterJour(droit.debut), formaterJour(droit.fin)),
      TEXTES_DROITS_CONGES.unites[lireUniteDroit(droit.uniteSaisie)],
      nombre(bilan.total),
      nombre(bilan.pris),
      nombre(bilan.prevus),
      nombre(bilan.soldePrevisionnel),
      droit.estConfirme ? TEXTES_DROITS_CONGES.etats[etatSolde(bilan.soldePrevisionnel)] : valeurs.aConfirmer,
    ];
  });
  return { ...limiter(lignes), estTronque: droits.length >= STATISTIQUES_EMPLOYES_MAX };
}

/** Pointages manuels de la période (heure de Casablanca), du plus récent au plus ancien. */
async function etatPointages(recherche: RechercheEtat): Promise<TableauEtat> {
  const lignesBase = await obtenirBase()
    .select({
      horodatage: pointages.horodatage,
      etat: pointages.etat,
      remarque: pointages.remarque,
      matricule: employes.matricule,
      prenom: employes.prenom,
      nom: employes.nom,
      departement: departements.nom,
      saisiPar: utilisateurs.nom,
    })
    .from(pointages)
    .innerJoin(employes, eq(employes.id, pointages.employeId))
    .innerJoin(departements, eq(departements.id, employes.departementId))
    .leftJoin(utilisateurs, eq(utilisateurs.id, pointages.saisiPar))
    .where(
      and(
        await conditionEmployes(recherche),
        eq(pointages.source, "manuel"),
        gte(pointages.horodatage, new Date(Date.parse(`${recherche.du}T00:00:00Z`) - UN_JOUR_MILLISECONDES)),
        lt(pointages.horodatage, new Date(Date.parse(`${recherche.au}T00:00:00Z`) + 2 * UN_JOUR_MILLISECONDES)),
      ),
    )
    .orderBy(desc(pointages.horodatage))
    .limit(RAPPORT_LIGNES_MAX + 1);
  const etats: Record<string, string> = TEXTES_EXCEPTIONS.pointages.etats;
  const lignes = lignesBase.flatMap((ligne) => {
    const local = jourEtMinuteLocaux(ligne.horodatage, FUSEAU_HORAIRE);
    if (local.jour < recherche.du || local.jour > recherche.au) return [];
    return [[formaterJour(local.jour), minutesVersHeure(local.minutes), ligne.matricule, `${ligne.prenom} ${ligne.nom}`, ligne.departement, etats[ligne.etat] ?? ligne.etat, ligne.remarque ?? "", ligne.saisiPar ?? valeurs.compteSupprime]];
  });
  return { ...limiter(lignes), estTronque: lignesBase.length > RAPPORT_LIGNES_MAX };
}

/** Lignes d'un état pour ces filtres (les droits sont vérifiés par l'appelant). */
export function chargerEtat(etat: Etat, recherche: RechercheEtat, maintenant: { jour: string; minute: number }): Promise<TableauEtat> {
  if (etat === "presences") return etatPresences(recherche, maintenant);
  if (etat === "evenements") return etatEvenements(recherche);
  if (etat === "conges") return etatConges(recherche, maintenant.jour);
  return etatPointages(recherche);
}
