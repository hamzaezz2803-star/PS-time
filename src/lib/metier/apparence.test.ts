import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APPARENCE_PAR_DEFAUT, apparenceDepuisReglages, estPolice, estTheme } from "./apparence.ts";

describe("apparenceDepuisReglages", () => {
  it("reprend le thème et la police enregistrés", () => {
    const reglages = [
      { cle: "theme", valeur: "emeraude" },
      { cle: "police", valeur: "inter" },
    ];
    assert.deepEqual(apparenceDepuisReglages(reglages), { theme: "emeraude", police: "inter" });
  });

  it("garde le choix par défaut quand rien n'est enregistré", () => {
    assert.deepEqual(apparenceDepuisReglages([]), APPARENCE_PAR_DEFAUT);
  });

  it("ignore une valeur inconnue", () => {
    const reglages = [
      { cle: "theme", valeur: "violet" },
      { cle: "police", valeur: "atkinson" },
    ];
    assert.deepEqual(apparenceDepuisReglages(reglages), { theme: APPARENCE_PAR_DEFAUT.theme, police: "atkinson" });
  });
});

describe("estTheme et estPolice", () => {
  it("reconnaissent seulement les valeurs de l'application", () => {
    assert.equal(estTheme("ocean"), true);
    assert.equal(estTheme("inter"), false);
    assert.equal(estPolice("source_sans"), true);
    assert.equal(estPolice("arial"), false);
  });
});
