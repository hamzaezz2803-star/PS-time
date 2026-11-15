import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chaineRecherche, correspondARecherche, motifContient, normaliserRecherche } from "./recherche.ts";

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

describe("motifContient", () => {
  it("entoure de % et neutralise les jokers saisis", () => {
    assert.equal(motifContient("ali"), "%ali%");
    assert.equal(motifContient("50%_a\\b"), "%50\\%\\_a\\\\b%");
  });
});

describe("chaineRecherche", () => {
  it("garde seulement les valeurs renseignées", () => {
    assert.equal(chaineRecherche({ nom: "Ali Ben", matricule: "", departement: null, page: 2 }), "?nom=Ali+Ben&page=2");
  });

  it("renvoie une chaîne vide sans critère", () => {
    assert.equal(chaineRecherche({ nom: "", page: undefined }), "");
  });
});
