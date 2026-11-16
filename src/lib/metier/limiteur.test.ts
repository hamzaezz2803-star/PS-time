import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { creerLimiteur } from "./limiteur.ts";

describe("creerLimiteur", () => {
  it("refuse au-delà du maximum dans la fenêtre, puis autorise à nouveau", () => {
    const limiteur = creerLimiteur(2, 60_000);
    assert.equal(limiteur.autoriser("ip-a", 0), true);
    assert.equal(limiteur.autoriser("ip-a", 1_000), true);
    assert.equal(limiteur.autoriser("ip-a", 2_000), false);
    assert.equal(limiteur.autoriser("ip-a", 60_000), true);
  });

  it("compte chaque clé séparément", () => {
    const limiteur = creerLimiteur(1, 60_000);
    assert.equal(limiteur.autoriser("ip-a", 0), true);
    assert.equal(limiteur.autoriser("ip-b", 0), true);
    assert.equal(limiteur.autoriser("ip-a", 10), false);
  });
});
