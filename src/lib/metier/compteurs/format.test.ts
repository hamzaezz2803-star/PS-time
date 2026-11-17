import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changeLaVersion, colonnesDesPeriodicites, formaterMinutes, formaterValeur, periodicitesDesColonnes } from "./format.ts";

describe("affichage des valeurs", () => {
  it("écrit les minutes en heures et minutes", () => {
    assert.equal(formaterMinutes(90), "1h 30");
    assert.equal(formaterMinutes(45), "0h 45");
    assert.equal(formaterMinutes(600), "10h 00");
    assert.equal(formaterMinutes(-75), "-1h 15");
    assert.equal(formaterMinutes(0.4), "0h 00");
    assert.equal(formaterMinutes(-0.4), "0h 00");
  });

  it("suit l'unité du compteur (virgule décimale)", () => {
    assert.equal(formaterValeur(7.5, "heures"), "7,5 h");
    assert.equal(formaterValeur(3, "jours"), "3 j");
    assert.equal(formaterValeur(85.257, "pourcentage"), "85,26 %");
    assert.equal(formaterValeur(12, "nombre"), "12");
    assert.equal(formaterValeur(125, "minutes"), "2h 05");
  });
});

describe("périodicités et versions", () => {
  it("passe des colonnes de la base à la liste et inversement", () => {
    assert.deepEqual(periodicitesDesColonnes({ journalier: true, hebdomadaire: false, mensuel: true }), ["JOUR", "MOIS"]);
    assert.deepEqual(colonnesDesPeriodicites(["SEMAINE"]), { journalier: false, hebdomadaire: true, mensuel: false });
  });

  it("crée une version seulement si la formule, l'unité ou les périodicités changent", () => {
    const avant = { formule: "RETARD_MIN", unite: "minutes", periodicites: ["JOUR"] as const };
    assert.equal(changeLaVersion(avant, { ...avant }), false);
    assert.equal(changeLaVersion(avant, { ...avant, formule: "RETARD_MIN + 1" }), true);
    assert.equal(changeLaVersion(avant, { ...avant, unite: "heures" }), true);
    assert.equal(changeLaVersion(avant, { ...avant, periodicites: ["JOUR", "MOIS"] }), true);
  });
});
