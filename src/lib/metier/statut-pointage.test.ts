import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProfilHoraire, Rotation } from "../../types/index.ts";
import { affectationDuJour, planningDuJour, type DonneesPlanning } from "./planning-jour.ts";
import { PLAGES_JOURNEE_TYPE } from "./profil-horaire.ts";
import { statutPointage, type EtatPointageEvalue } from "./statut-pointage.ts";

// Données fictives. Fuseau « UTC » : l'heure écrite est l'heure locale.
const JOURNEE: ProfilHoraire = {
  id: "j8",
  code: "J8",
  nom: "Journée 8 h",
  type: "travail",
  estBadge: true,
  repasMinimumMinutes: 45,
  repasMaximumMinutes: 120,
  // 07-08 variable, 07:55-08:00 retard toléré n'existe pas ici : voir AVEC_TOLERANCE.
  plages: PLAGES_JOURNEE_TYPE,
};
const AVEC_TOLERANCE: ProfilHoraire = {
  ...JOURNEE,
  id: "tol",
  plages: [
    { debut: 0, fin: 420, type: "interdite" },
    { debut: 420, fin: 480, type: "variable" },
    { debut: 480, fin: 490, type: "retard_tolere" },
    { debut: 490, fin: 1020, type: "fixe" },
    { debut: 1020, fin: 1080, type: "neutralisee" },
    { debut: 1080, fin: 1440, type: "interdite" },
  ],
};
const NON_BADGE: ProfilHoraire = { ...JOURNEE, id: "nb", estBadge: false };
const REPOS: ProfilHoraire = { ...JOURNEE, id: "rep", code: "REP", nom: "Repos", type: "repos", plages: [] };

// Semaine type : journée du lundi au vendredi, profil « Repos » le samedi, rien le dimanche.
const SEMAINE: Rotation = { id: "semaine", nom: "Semaine", type: "hebdomadaire", nombreJours: 7, jours: { 0: "j8", 1: "j8", 2: "j8", 3: "j8", 4: "j8", 5: "rep" } };
const UNE_JOUR: (profil: string) => Rotation = (profil) => ({ id: profil, nom: profil, type: "cycle", nombreJours: 1, jours: { 0: profil } });

const DONNEES: DonneesPlanning = {
  affectations: [
    { rotationId: "semaine", groupeId: "atelier", employeId: null, dateDebut: "2026-01-01", dateFin: null },
    { rotationId: "tol", groupeId: null, employeId: "tolere", dateDebut: "2026-01-01", dateFin: null },
    { rotationId: "nb", groupeId: null, employeId: "libre", dateDebut: "2026-01-01", dateFin: null },
  ],
  rotations: new Map([[SEMAINE.id, SEMAINE], ["tol", UNE_JOUR("tol")], ["nb", UNE_JOUR("nb")]]),
  profils: new Map([JOURNEE, AVEC_TOLERANCE, NON_BADGE, REPOS].map((profil) => [profil.id, profil])),
};

const OUVRIER = { id: "ouvrier", groupeId: "atelier" };
const h = (heures: number, minutes = 0) => heures * 60 + minutes;
// Lundi 16 novembre 2026.
const statut = (etat: EtatPointageEvalue, heure: string, employe = OUVRIER, jour = "2026-11-16") =>
  statutPointage({ horodatage: new Date(`${jour}T${heure}:00Z`), etat }, employe, DONNEES, "UTC");

describe("planningDuJour", () => {
  it("prend l'affectation de l'employé avant celle de son groupe", () => {
    const affectations = [
      { rotationId: "groupe", groupeId: "atelier", employeId: null, dateDebut: "2026-01-01", dateFin: null },
      { rotationId: "perso", groupeId: null, employeId: "ouvrier", dateDebut: "2026-11-01", dateFin: "2026-11-30" },
    ];
    assert.equal(affectationDuJour(OUVRIER, "2026-11-16", affectations)?.rotationId, "perso");
    assert.equal(affectationDuJour(OUVRIER, "2026-12-01", affectations)?.rotationId, "groupe");
  });

  it("donne le profil de travail, un repos (profil Repos ou jour vide) ou rien", () => {
    assert.equal(planningDuJour(OUVRIER, "2026-11-16", DONNEES).type, "travail");
    assert.equal(planningDuJour(OUVRIER, "2026-11-21", DONNEES).type, "repos");
    assert.equal(planningDuJour(OUVRIER, "2026-11-22", DONNEES).type, "repos");
    assert.equal(planningDuJour({ id: "seul", groupeId: null }, "2026-11-16", DONNEES).type, "aucun");
  });
});

describe("statutPointage : exemple du schéma (réel 7:30, 12:00, 13:30, 19:00)", () => {
  it("valide 08:00, 12:00, 14:00 et 18:00, sans retard", () => {
    assert.deepEqual([statut("entree", "07:30").code, statut("entree", "07:30").pointValide], ["a_l_heure", h(8)]);
    assert.deepEqual([statut("debut_pause", "12:00").code, statut("debut_pause", "12:00").pointValide], ["conforme", h(12)]);
    assert.deepEqual([statut("fin_pause", "13:30").code, statut("fin_pause", "13:30").pointValide], ["conforme", h(14)]);
    assert.deepEqual([statut("sortie", "19:00").code, statut("sortie", "19:00").pointValide], ["a_l_heure", h(18)]);
  });
});

describe("statutPointage : plages fixes", () => {
  it("compte le retard et le départ anticipé à partir des bornes de la plage fixe", () => {
    assert.deepEqual(statut("entree", "08:12"), { code: "retard", minutes: 12, pointValide: h(8, 12), profil: JOURNEE });
    assert.equal(statut("sortie", "17:40").code, "depart_anticipe");
    assert.equal(statut("sortie", "17:40").minutes, 20);
  });

  it("signale une pause commencée tôt et un retour de pause tardif", () => {
    assert.equal(statut("debut_pause", "11:50").code, "pause_anticipee");
    assert.equal(statut("debut_pause", "11:50").minutes, 10);
    assert.equal(statut("fin_pause", "14:05").code, "retour_pause_retard");
    assert.equal(statut("fin_pause", "14:05").minutes, 5);
  });
});

describe("statutPointage : autres plages et cas", () => {
  it("refuse une plage interdite et signale une plage neutralisée", () => {
    assert.equal(statut("entree", "05:00").code, "plage_interdite");
    assert.equal(statut("sortie", "17:30", { id: "tolere", groupeId: null }).code, "plage_neutralisee");
  });

  it("tolère un retard dans la plage de retard toléré, validé au début de la plage fixe", () => {
    const resultat = statut("entree", "08:04", { id: "tolere", groupeId: null });
    assert.deepEqual([resultat.code, resultat.minutes, resultat.pointValide], ["retard_tolere", 4, h(8, 10)]);
  });

  it("indique repos, profil non badgé et absence de planning", () => {
    assert.equal(statut("entree", "08:00", OUVRIER, "2026-11-21").code, "jour_repos");
    assert.equal(statut("entree", "09:00", { id: "libre", groupeId: null }).code, "non_badge");
    assert.equal(statut("entree", "08:00", { id: "seul", groupeId: null }).code, "aucun_planning");
  });
});
