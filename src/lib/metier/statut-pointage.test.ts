import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Calendrier, Rotation } from "../../types/index.ts";
import { affectationDuJour, planningDuJour, type DonneesPlanning } from "./planning-jour.ts";
import { statutPointage, type EtatPointageEvalue } from "./statut-pointage.ts";

// Données fictives. Fuseau « UTC » : l'heure écrite est l'heure locale.
const BUREAU: Calendrier = {
  id: "bureau",
  nom: "Bureau",
  debutMinutes: 8 * 60,
  finMinutes: 17 * 60,
  pauseDebutMinutes: 12 * 60,
  pauseFinMinutes: 13 * 60,
  entreeAvantMinutes: 60,
  entreeApresMinutes: 60,
  sortieAvantMinutes: 60,
  sortieApresMinutes: 60,
  retardTolereMinutes: 5,
  departAnticipeTolereMinutes: 5,
  pointageEntreeObligatoire: true,
  pointageSortieObligatoire: true,
  heuresSupActives: true,
  heuresSupApresMinutes: 15,
  heuresSupMinimumMinutes: 30,
  heuresSupMaximumMinutes: 120,
};
const NUIT: Calendrier = { ...BUREAU, id: "nuit", nom: "Nuit", debutMinutes: 22 * 60, finMinutes: 6 * 60, pauseDebutMinutes: 2 * 60, pauseFinMinutes: 2 * 60 + 30, heuresSupActives: false };

// Semaine type : bureau du lundi au vendredi, repos le week-end.
const SEMAINE: Rotation = { id: "semaine", nom: "Semaine", type: "hebdomadaire", nombreJours: 7, jours: { 0: "bureau", 1: "bureau", 2: "bureau", 3: "bureau", 4: "bureau" } };
// Cycle de 2 jours : nuit puis repos.
const CYCLE_NUIT: Rotation = { id: "cycle", nom: "Nuits", type: "cycle", nombreJours: 2, jours: { 0: "nuit" } };

const DONNEES: DonneesPlanning = {
  affectations: [
    { rotationId: "semaine", groupeId: "atelier", employeId: null, dateDebut: "2026-01-01", dateFin: null },
    { rotationId: "cycle", groupeId: null, employeId: "veilleur", dateDebut: "2026-11-02", dateFin: null },
  ],
  rotations: new Map([[SEMAINE.id, SEMAINE], [CYCLE_NUIT.id, CYCLE_NUIT]]),
  calendriers: new Map([[BUREAU.id, BUREAU], [NUIT.id, NUIT]]),
};

const OUVRIER = { id: "ouvrier", groupeId: "atelier" };
// Lundi 16 novembre 2026.
const statut = (horodatage: string, etat: EtatPointageEvalue, employe: { id: string; groupeId: string | null } = OUVRIER) =>
  statutPointage({ horodatage: new Date(horodatage), etat }, employe, DONNEES, "UTC");

describe("planningDuJour", () => {
  it("prend l'affectation de l'employé avant celle de son groupe", () => {
    const veilleurDansAtelier = { id: "veilleur", groupeId: "atelier" };
    assert.equal(affectationDuJour(veilleurDansAtelier, "2026-11-16", DONNEES.affectations)?.rotationId, "cycle");
  });

  it("suit le cycle depuis le début de l'affectation", () => {
    const veilleur = { id: "veilleur", groupeId: null };
    assert.equal(planningDuJour(veilleur, "2026-11-02", DONNEES).type, "travail");
    assert.equal(planningDuJour(veilleur, "2026-11-03", DONNEES).type, "repos");
  });

  it("ne trouve rien sans affectation ni avant son début", () => {
    assert.equal(planningDuJour({ id: "seul", groupeId: null }, "2026-11-16", DONNEES).type, "aucun");
    assert.equal(planningDuJour({ id: "veilleur", groupeId: null }, "2026-11-01", DONNEES).type, "aucun");
  });
});

describe("statutPointage : entrée", () => {
  it("à l'heure, y compris dans la tolérance", () => {
    assert.equal(statut("2026-11-16T07:50:00Z", "entree").code, "a_l_heure");
    assert.equal(statut("2026-11-16T08:05:00Z", "entree").code, "a_l_heure");
  });

  it("en retard au-delà de la tolérance, avec le nombre de minutes", () => {
    assert.deepEqual({ ...statut("2026-11-16T08:12:00Z", "entree"), calendrier: undefined }, { code: "retard", minutes: 12, calendrier: undefined, jourService: "2026-11-16" });
  });

  it("hors fenêtre trop tôt ou trop tard", () => {
    assert.equal(statut("2026-11-16T06:30:00Z", "entree").code, "hors_fenetre");
    assert.equal(statut("2026-11-16T09:30:00Z", "entree").code, "hors_fenetre");
  });

  it("jour de repos et absence de planning", () => {
    assert.equal(statut("2026-11-15T08:00:00Z", "entree").code, "jour_repos");
    assert.equal(statut("2026-11-16T08:00:00Z", "entree", { id: "seul", groupeId: null }).code, "aucun_planning");
  });
});

describe("statutPointage : sortie", () => {
  it("départ anticipé au-delà de la tolérance", () => {
    assert.deepEqual([statut("2026-11-16T16:40:00Z", "sortie").code, statut("2026-11-16T16:40:00Z", "sortie").minutes], ["depart_anticipe", 20]);
    assert.equal(statut("2026-11-16T16:57:00Z", "sortie").code, "a_l_heure");
  });

  it("heures sup. comptées après le délai, à partir du minimum, plafonnées", () => {
    // 17:40 : 40 min après la fin, moins 15 min de délai = 25 min, sous le minimum de 30.
    assert.equal(statut("2026-11-16T17:40:00Z", "sortie").code, "a_l_heure");
    assert.deepEqual([statut("2026-11-16T18:00:00Z", "sortie").code, statut("2026-11-16T18:00:00Z", "sortie").minutes], ["heures_sup", 45]);
    // 19:30 : 135 min comptables, plafonnées à 120 (fenêtre élargie au-delà du plafond).
    assert.equal(statut("2026-11-16T19:30:00Z", "sortie").minutes, 120);
  });
});

describe("statutPointage : pauses et heures sup.", () => {
  it("pause anticipée et retour de pause en retard", () => {
    assert.deepEqual([statut("2026-11-16T11:45:00Z", "debut_pause").code, statut("2026-11-16T11:45:00Z", "debut_pause").minutes], ["pause_anticipee", 15]);
    assert.equal(statut("2026-11-16T12:05:00Z", "debut_pause").code, "conforme");
    assert.deepEqual([statut("2026-11-16T13:20:00Z", "fin_pause").code, statut("2026-11-16T13:20:00Z", "fin_pause").minutes], ["retour_pause_retard", 20]);
  });

  it("heures sup. pointées avant la fin du service", () => {
    assert.equal(statut("2026-11-16T16:00:00Z", "debut_heures_sup").code, "avant_fin_service");
    assert.equal(statut("2026-11-16T17:30:00Z", "debut_heures_sup").code, "conforme");
  });
});

describe("statutPointage : service de nuit", () => {
  const veilleur = { id: "veilleur", groupeId: null };

  it("rattache la sortie du matin au service commencé la veille", () => {
    const resultat = statut("2026-11-03T06:00:00Z", "sortie", veilleur);
    assert.equal(resultat.code, "a_l_heure");
    assert.equal(resultat.jourService, "2026-11-02");
  });

  it("place la pause de 02:00 dans le service de la veille", () => {
    assert.equal(statut("2026-11-03T02:40:00Z", "fin_pause", veilleur).code, "retour_pause_retard");
  });

  it("refuse des heures sup. non prévues par le calendrier", () => {
    assert.equal(statut("2026-11-03T06:30:00Z", "debut_heures_sup", veilleur).code, "heures_sup_non_prevues");
  });
});
