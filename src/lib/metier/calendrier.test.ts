import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bornerJour, estDansBornes, estJourValide, grilleCalendrier, jourApresTouche, memeJourAutreMois } from "./calendrier.ts";

describe("calendrier", () => {
  it("reconnaît un jour réel bien formé", () => {
    assert.equal(estJourValide("2026-11-26"), true);
    assert.equal(estJourValide("2026-02-30"), false);
    assert.equal(estJourValide("26/11/2026"), false);
    assert.equal(estJourValide(""), false);
  });

  it("remplit la grille du lundi au dimanche avec les jours des mois voisins", () => {
    const grille = grilleCalendrier("2026-11");
    assert.equal(grille.length, 6);
    assert.deepEqual(grille[0][0], { jour: "2026-10-26", estDuMois: false });
    assert.deepEqual(grille[0][6], { jour: "2026-11-01", estDuMois: true });
    assert.deepEqual(grille[5][0], { jour: "2026-11-30", estDuMois: true });
    assert.deepEqual(grille[5][6], { jour: "2026-12-06", estDuMois: false });
  });

  it("respecte les bornes incluses", () => {
    assert.equal(estDansBornes("2026-11-26", undefined, "2026-11-26"), true);
    assert.equal(estDansBornes("2026-11-27", undefined, "2026-11-26"), false);
    assert.equal(estDansBornes("2026-01-01", "2026-01-02"), false);
    assert.equal(bornerJour("2026-12-01", undefined, "2026-11-26"), "2026-11-26");
    assert.equal(bornerJour("2026-11-01", "2026-11-05"), "2026-11-05");
  });

  it("déplace le jour actif au clavier", () => {
    assert.equal(jourApresTouche("2026-11-26", "ArrowRight"), "2026-11-27");
    assert.equal(jourApresTouche("2026-11-26", "ArrowUp"), "2026-11-19");
    assert.equal(jourApresTouche("2026-11-26", "Home"), "2026-11-23");
    assert.equal(jourApresTouche("2026-11-26", "End"), "2026-11-29");
    assert.equal(jourApresTouche("2026-11-26", "PageDown"), "2026-12-26");
    assert.equal(jourApresTouche("2026-11-26", "Enter"), null);
  });

  it("garde le jour en changeant de mois, sinon le dernier du mois", () => {
    assert.equal(memeJourAutreMois("2026-01-31", 1), "2026-02-28");
    assert.equal(memeJourAutreMois("2026-03-31", -1), "2026-02-28");
    assert.equal(memeJourAutreMois("2028-01-30", 1), "2028-02-29");
    assert.equal(memeJourAutreMois("2026-12-15", 1), "2027-01-15");
  });
});
