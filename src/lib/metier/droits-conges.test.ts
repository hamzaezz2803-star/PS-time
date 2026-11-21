import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bilanDroit, estNombreDeJoursValide, etatSolde, joursDecomptes, pourcentageConsomme } from "./droits-conges.ts";

const ANNEE_2026 = { debut: "2026-01-01", fin: "2026-12-31", joursAcquis: 18, joursReliquat: 3 };
const journees = (debut: string, fin: string) => ({ debut, fin, debutMinutes: null, finMinutes: null });
const aucunRepos = () => false;
// 2026-11-21 est un samedi, 2026-11-22 un dimanche.
const weekEnd = (jour: string) => jour === "2026-11-21" || jour === "2026-11-22";

describe("jours décomptés d'une absence", () => {
  it("compte chaque jour d'une absence en journées entières", () => {
    assert.deepEqual(joursDecomptes(journees("2026-03-02", "2026-03-04"), ANNEE_2026, aucunRepos), ["2026-03-02", "2026-03-03", "2026-03-04"]);
  });

  it("ne compte pas les jours de repos du planning", () => {
    assert.equal(joursDecomptes(journees("2026-11-19", "2026-11-24"), ANNEE_2026, weekEnd).length, 4);
  });

  it("ne garde que les jours compris dans la période du droit", () => {
    assert.deepEqual(joursDecomptes(journees("2025-12-30", "2026-01-02"), ANNEE_2026, aucunRepos), ["2026-01-01", "2026-01-02"]);
  });

  it("ignore une saisie en heures", () => {
    assert.deepEqual(joursDecomptes({ debut: "2026-03-02", fin: "2026-03-02", debutMinutes: 600, finMinutes: 720 }, ANNEE_2026, aucunRepos), []);
  });
});

describe("bilan d'un droit", () => {
  it("additionne reliquat et acquis, sépare les jours pris des jours prévus", () => {
    const bilan = bilanDroit(ANNEE_2026, [journees("2026-03-02", "2026-03-06"), journees("2026-11-20", "2026-11-25")], "2026-11-21", aucunRepos);
    assert.equal(bilan.acquis, 21);
    assert.equal(bilan.pris, 5 + 2);
    assert.equal(bilan.prevus, 4);
    assert.equal(bilan.soldeAujourdhui, 14);
    assert.equal(bilan.soldePrevisionnel, 10);
    assert.equal(bilan.absences.length, 2);
  });

  it("écarte les absences sans aucun jour décompté", () => {
    const bilan = bilanDroit(ANNEE_2026, [journees("2026-11-21", "2026-11-22")], "2026-11-21", weekEnd);
    assert.equal(bilan.absences.length, 0);
    assert.equal(bilan.soldePrevisionnel, 21);
  });

  it("donne un solde négatif quand on prend plus que l'acquis", () => {
    const bilan = bilanDroit({ ...ANNEE_2026, joursAcquis: 1.5, joursReliquat: 0 }, [journees("2026-03-02", "2026-03-03")], "2026-11-21", aucunRepos);
    assert.equal(bilan.soldePrevisionnel, -0.5);
    assert.equal(etatSolde(bilan.soldePrevisionnel), "depasse");
  });
});

describe("affichage du solde", () => {
  it("donne l'état du solde", () => {
    assert.equal(etatSolde(4), "disponible");
    assert.equal(etatSolde(0), "epuise");
    assert.equal(etatSolde(-1), "depasse");
  });

  it("borne la part consommée entre 0 et 100", () => {
    assert.equal(pourcentageConsomme({ acquis: 20, pris: 5, prevus: 5 }), 50);
    assert.equal(pourcentageConsomme({ acquis: 2, pris: 5, prevus: 0 }), 100);
    assert.equal(pourcentageConsomme({ acquis: 0, pris: 0, prevus: 0 }), 0);
  });

  it("accepte les demi-journées, refuse le reste", () => {
    assert.equal(estNombreDeJoursValide(18, 366), true);
    assert.equal(estNombreDeJoursValide(2.5, 366), true);
    assert.equal(estNombreDeJoursValide(2.25, 366), false);
    assert.equal(estNombreDeJoursValide(-1, 366), false);
    assert.equal(estNombreDeJoursValide(400, 366), false);
  });
});
