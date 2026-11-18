import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { graduations, hauteurPourcent } from "./graphiques.ts";

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
