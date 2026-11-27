import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { graduations, hauteurPourcent, segmentsCourbe } from "./graphiques.ts";

describe("graduations", () => {
  it("choisit un pas rond qui couvre le maximum", () => {
    assert.deepEqual(graduations(16), [0, 5, 10, 15, 20]);
    assert.deepEqual(graduations(100), [0, 50, 100]);
    assert.deepEqual(graduations(1), [0, 1]);
    assert.deepEqual(graduations(3), [0, 1, 2, 3]);
    assert.deepEqual(graduations(130), [0, 50, 100, 150]);
  });

  it("donne une échelle minimale sans données", () => {
    assert.deepEqual(graduations(0), [0, 1]);
  });
});

describe("hauteurPourcent", () => {
  it("borne la hauteur entre 0 et 100 %", () => {
    assert.equal(hauteurPourcent(5, 20), 25);
    assert.equal(hauteurPourcent(30, 20), 100);
    assert.equal(hauteurPourcent(5, 0), 0);
  });
});

describe("segmentsCourbe", () => {
  it("place chaque valeur au centre de sa colonne, le haut de l'axe en haut", () => {
    assert.deepEqual(segmentsCourbe([100, 50, 0, 25], 100), [
      [
        { rang: 0, x: 12.5, y: 0 },
        { rang: 1, x: 37.5, y: 50 },
        { rang: 2, x: 62.5, y: 100 },
        { rang: 3, x: 87.5, y: 75 },
      ],
    ]);
  });

  it("coupe la courbe sur une valeur manquante au lieu de la tracer à zéro", () => {
    const segments = segmentsCourbe([80, null, null, 90, 70], 100);
    assert.equal(segments.length, 2);
    assert.deepEqual(segments.map((segment) => segment.map((point) => point.rang)), [[0], [3, 4]]);
  });

  it("ne donne aucun segment sans valeur", () => {
    assert.deepEqual(segmentsCourbe([null, null], 100), []);
    assert.deepEqual(segmentsCourbe([], 100), []);
  });
});
