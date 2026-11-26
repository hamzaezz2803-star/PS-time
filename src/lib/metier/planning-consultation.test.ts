import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bornesDuMois, codeDuJour, estWeekEnd, jourDePlanning, moisVoisin, numeroSemaine, semainesDuMois, totaliser } from "./planning-consultation.ts";
import type { EvenementPeriode } from "./resume-jour.ts";

const AUJOURDHUI = "2026-11-25";
const HORAIRE = { debutPrevu: 480, finPrevue: 1020, dureePrevue: 480, estBadge: true };
const PROFIL = { code: "J8", nom: "Journée", estDynamique: false };
const journee = (jour: string, pointages: number[], horaire: typeof HORAIRE | null = HORAIRE) => ({ jour, horaire, pointages, profil: horaire ? PROFIL : null });
const CONGE: EvenementPeriode = { code: "CA", nom: "Congé annuel", type: "absence", priorite: 10, neutralisePointage: false, debut: "2026-11-16", fin: "2026-11-16" };

describe("jourDePlanning", () => {
  it("garde le profil, le théorique et le temps travaillé", () => {
    const jour = jourDePlanning(journee("2026-11-18", [480, 1020]), [], new Set(), AUJOURDHUI);
    assert.equal(jour.profilCode, "J8");
    assert.equal(jour.theoriqueMinutes, 480);
    assert.equal(jour.travailleMinutes, 540);
    assert.deepEqual(jour.anomalies, []);
    assert.equal(codeDuJour(jour), "J8");
  });
  it("signale une absence non justifiée, un retard et une sortie manquante", () => {
    assert.deepEqual(jourDePlanning(journee("2026-11-17", []), [], new Set(), AUJOURDHUI).anomalies, ["absence"]);
    assert.deepEqual(jourDePlanning(journee("2026-11-19", [500]), [], new Set(), AUJOURDHUI).anomalies, ["retard", "sortie_manquante"]);
  });
  it("ne signale rien hors de la période d'emploi", () => {
    const avant = jourDePlanning(journee("2026-11-17", []), [], new Set(), AUJOURDHUI, { debutEmploi: "2026-11-20", finEmploi: null });
    assert.deepEqual(avant.anomalies, []);
  });
  it("ne signale rien pour un événement, un repos, aujourd'hui sans pointage ou un jour futur", () => {
    const conge = jourDePlanning(journee("2026-11-16", []), [CONGE], new Set(), AUJOURDHUI);
    assert.deepEqual(conge.anomalies, []);
    assert.equal(codeDuJour(conge), "CA");
    assert.deepEqual(jourDePlanning(journee("2026-11-22", [], null), [], new Set(), AUJOURDHUI).anomalies, []);
    assert.deepEqual(jourDePlanning(journee(AUJOURDHUI, []), [], new Set(), AUJOURDHUI).anomalies, []);
    const futur = jourDePlanning(journee("2026-11-30", []), [], new Set(["2026-11-30"]), AUJOURDHUI);
    assert.equal(futur.estFutur, true);
    assert.equal(futur.aEvenementEnHeures, true);
  });
});

describe("calendrier", () => {
  it("numérote les semaines selon ISO 8601", () => {
    assert.equal(numeroSemaine("2026-11-25"), 48);
    assert.equal(numeroSemaine("2026-01-01"), 1);
    assert.equal(numeroSemaine("2027-01-01"), 53);
  });
  it("découpe un mois en semaines du lundi au dimanche", () => {
    const semaines = semainesDuMois("2026-11");
    assert.equal(semaines.length, 6);
    assert.deepEqual(semaines[0].jours, [null, null, null, null, null, null, "2026-11-01"]);
    assert.equal(semaines[5].jours[0], "2026-11-30");
    assert.equal(semaines[5].jours[1], null);
  });
  it("donne les bornes et les mois voisins", () => {
    assert.deepEqual(bornesDuMois("2028-02"), { debut: "2028-02-01", fin: "2028-02-29" });
    assert.equal(moisVoisin("2026-01", -1), "2025-12");
    assert.equal(moisVoisin("2026-12", 1), "2027-01");
  });
  it("reconnaît le week-end", () => {
    assert.equal(estWeekEnd("2026-11-28"), true);
    assert.equal(estWeekEnd("2026-11-27"), false);
  });
});

describe("totaliser", () => {
  it("additionne les seules valeurs connues", () => {
    const jours = [
      jourDePlanning(journee("2026-11-17", []), [], new Set(), AUJOURDHUI),
      jourDePlanning(journee("2026-11-18", [480, 1020]), [], new Set(), AUJOURDHUI),
      jourDePlanning(journee("2026-11-22", [], null), [], new Set(), AUJOURDHUI),
    ];
    assert.deepEqual(totaliser(jours), { joursPlanifies: 2, theoriqueMinutes: 960, travailleMinutes: 540, absences: 1, retards: 0, joursAvecEvenement: 0 });
  });
});
