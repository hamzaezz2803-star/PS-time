import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AUCUNE_COULEURS_TEST, codesColoresAffiches, estCouleurRegle, teinteDuJour, type CouleursPlanning } from "./couleurs-planning-test-aide.ts";

const COULEURS: CouleursPlanning = {
  evenements: new Map([["MAL", { couleur: "rouge", nom: "Maladie" }]]),
  profils: new Map([["J8", { couleur: "bleu", nom: "Journée de 8 h" }]]),
};
const conge = { code: "CA", type: "absence" as const };
const maladie = { code: "MAL", type: "absence" as const };
const mission = { code: "MIS", type: "presence" as const };

describe("teinteDuJour", () => {
  it("prend la couleur choisie pour l'événement retenu ou le profil", () => {
    assert.equal(teinteDuJour({ evenement: maladie, profilCode: "J8", estSansPlanning: false }, COULEURS), "rouge");
    assert.equal(teinteDuJour({ evenement: null, profilCode: "J8", estSansPlanning: false }, COULEURS), "bleu");
  });

  it("garde la couleur du type quand aucune n'est choisie", () => {
    assert.equal(teinteDuJour({ evenement: conge, profilCode: "J8", estSansPlanning: false }, COULEURS), "orange");
    assert.equal(teinteDuJour({ evenement: mission, profilCode: null, estSansPlanning: false }, COULEURS), "turquoise");
    assert.equal(teinteDuJour({ evenement: null, profilCode: "M7", estSansPlanning: false }, COULEURS), "travail");
    assert.equal(teinteDuJour({ evenement: null, profilCode: null, estSansPlanning: false }, AUCUNE_COULEURS_TEST), "vert");
  });

  it("ne confond jamais un jour sans affectation avec un repos", () => {
    assert.equal(teinteDuJour({ evenement: null, profilCode: null, estSansPlanning: true }, COULEURS), "sans_planning");
  });
});

describe("codesColoresAffiches", () => {
  it("liste une fois chaque code à couleur choisie affiché, événements d'abord", () => {
    const jours = [
      { evenement: null, profilCode: "J8", estSansPlanning: false },
      { evenement: maladie, profilCode: "J8", estSansPlanning: false },
      { evenement: null, profilCode: "J8", estSansPlanning: false },
      { evenement: conge, profilCode: null, estSansPlanning: false },
    ];
    assert.deepEqual(codesColoresAffiches(jours, COULEURS), [
      { genre: "evenement", code: "MAL", nom: "Maladie", couleur: "rouge" },
      { genre: "profil", code: "J8", nom: "Journée de 8 h", couleur: "bleu" },
    ]);
  });

  it("ignore le profil d'un jour où un événement est retenu", () => {
    assert.deepEqual(codesColoresAffiches([{ evenement: conge, profilCode: "J8", estSansPlanning: false }], COULEURS), []);
  });
});

describe("estCouleurRegle", () => {
  it("accepte seulement les couleurs de la palette", () => {
    assert.equal(estCouleurRegle("turquoise"), true);
    assert.equal(estCouleurRegle("violet"), false);
    assert.equal(estCouleurRegle(""), false);
  });
});
