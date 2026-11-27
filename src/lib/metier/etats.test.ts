import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { JourService } from "./compteurs/variables.ts";
import { estEtat, joursDeLaSaisie, lignesPresences, statutEtat } from "./etats.ts";
import type { EmployeStatistiques } from "./statistiques-presence.ts";

const HORAIRE = { debutPrevu: 480, finPrevue: 1020, dureePrevue: 480, estBadge: true };
const MAINTENANT = { jour: "2026-11-20", minute: 720 };
const journee = (jour: string, pointages: number[], horaire: JourService["horaire"] = HORAIRE): JourService => ({ jour, horaire, pointages });
const regles = { priorite: 10, neutralisePointage: false, type: "absence" as const };

const employe: EmployeStatistiques = {
  id: "a",
  departement: "Atelier",
  debutEmploi: null,
  finEmploi: null,
  jours: [journee("2026-11-16", [495, 1020]), journee("2026-11-17", []), journee("2026-11-18", []), journee("2026-11-19", [480]), journee("2026-11-21", [], null)],
  evenements: [
    { ...regles, id: "cp", code: "CP", nom: "Congé payé", debut: "2026-11-17", fin: "2026-11-19" },
    { ...regles, id: "mal", code: "MAL", nom: "Maladie", priorite: 50, debut: "2026-11-18", fin: "2026-11-18" },
  ],
};

describe("menu État", () => {
  it("reconnaît les états connus", () => {
    assert.equal(estEtat("presences"), true);
    assert.equal(estEtat("autre"), false);
  });

  it("donne une ligne par jour attendu, pointé ou avec un événement, du plus récent au plus ancien", () => {
    const lignes = lignesPresences([employe], MAINTENANT);
    assert.deepEqual(
      lignes.map((ligne) => [ligne.resume.jour, ligne.statut, ligne.resume.evenement?.code ?? null]),
      [
        ["2026-11-19", "a_l_heure", null],
        ["2026-11-18", "justifie", "MAL"],
        ["2026-11-17", "justifie", "CP"],
        ["2026-11-16", "en_retard", null],
      ],
    );
  });

  it("compte les jours prévus d'une saisie et ceux où elle est retenue", () => {
    // Congé du 17 au 19 : le 18 la maladie l'emporte, le 19 un pointage l'emporte.
    assert.deepEqual(joursDeLaSaisie(employe, { id: "cp", debut: "2026-11-17", fin: "2026-11-19" }), { prevus: 3, valides: 1 });
    assert.deepEqual(joursDeLaSaisie(employe, { id: "mal", debut: "2026-11-18", fin: "2026-11-18" }), { prevus: 1, valides: 1 });
  });

  // Bug : sans aucune affectation, l'état donnait 0 jour validé alors que les droits aux congés en décomptaient 2.
  it("compte chaque jour d'un employé sans affectation, comme les droits aux congés, mais jamais un repos", () => {
    const sansPlanning: EmployeStatistiques = {
      ...employe,
      jours: [{ jour: "2026-11-06", horaire: null, pointages: [], estSansPlanning: true }, { jour: "2026-11-07", horaire: null, pointages: [], estSansPlanning: true }, journee("2026-11-08", [], null)],
      evenements: [{ ...regles, id: "cpr", code: "CPR", nom: "Congés reportés", debut: "2026-11-06", fin: "2026-11-08" }],
    };
    assert.deepEqual(joursDeLaSaisie(sansPlanning, { id: "cpr", debut: "2026-11-06", fin: "2026-11-08" }), { prevus: 2, valides: 2 });
  });

  it("garde la ligne d'un congé posé sur un repos, en repos et sans événement retenu", () => {
    const enRepos: EmployeStatistiques = {
      ...employe,
      jours: [journee("2026-11-21", [], null)],
      evenements: [{ ...regles, id: "cp", code: "CP", nom: "Congé payé", debut: "2026-11-21", fin: "2026-11-21" }],
    };
    const [ligne] = lignesPresences([enRepos], MAINTENANT);
    assert.equal(ligne.statut, "repos");
    assert.equal(ligne.resume.evenement, null);
    assert.deepEqual(ligne.resume.nonValides.map((evenement) => evenement.code), ["CP"]);
    assert.deepEqual(joursDeLaSaisie(enRepos, { id: "cp", debut: "2026-11-21", fin: "2026-11-21" }), { prevus: 0, valides: 0 });
  });

  // Bug : un repos, un jour sans affectation et une mission étaient tous écrits « Sans horaire » ou « À l'heure ».
  it("précise le statut écrit : repos, travail un jour de repos, aucun horaire, présent par un événement", () => {
    const resume = { estSansPlanning: false, entree: null, evenement: null };
    assert.equal(statutEtat(resume, "sans_horaire"), "repos");
    assert.equal(statutEtat({ ...resume, entree: 480 }, "sans_horaire"), "repos_travaille");
    assert.equal(statutEtat({ ...resume, estSansPlanning: true, entree: 480 }, "sans_horaire"), "aucun_horaire");
    assert.equal(statutEtat({ ...resume, evenement: { code: "MIS", nom: "Mission", type: "presence" } }, "a_l_heure"), "evenement_presence");
    assert.equal(statutEtat(resume, "absent"), "absent");
  });
});
