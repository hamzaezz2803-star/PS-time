import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { correspondARecherche, normaliserRecherche } from "./recherche.ts";

describe("normaliserRecherche", () => {
  it("retire accents, majuscules et espaces autour", () => {
    assert.equal(normaliserRecherche("  Équipe Nuit "), "equipe nuit");
  });
});

describe("correspondARecherche", () => {
  it("trouve sans tenir compte des accents ni de la casse", () => {
    assert.equal(correspondARecherche("Équipe de nuit", "EQUIPE"), true);
    assert.equal(correspondARecherche("Semaine bureau", "réau"), true);
  });

  it("accepte tout pour une recherche vide", () => {
    assert.equal(correspondARecherche("Semaine bureau", "   "), true);
  });

  it("refuse un texte absent", () => {
    assert.equal(correspondARecherche("Semaine bureau", "cycle"), false);
  });
});
