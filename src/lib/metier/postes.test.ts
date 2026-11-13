import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { codeDejaPris, comparerPostes } from "./postes.ts";

// Données fictives.
const POSTES = [
  { id: "1", code: "OP-01", nom: "Opérateur de tri", ordre: 99999 },
  { id: "2", code: "CH-01", nom: "Chef d'équipe", ordre: 10 },
  { id: "3", code: "AD-01", nom: "Agent administratif", ordre: 99999 },
];

describe("comparerPostes", () => {
  it("trie par ordre d'affichage puis par nom", () => {
    const tries = [...POSTES].sort(comparerPostes).map((poste) => poste.id);
    assert.deepEqual(tries, ["2", "3", "1"]);
  });
});

describe("codeDejaPris", () => {
  it("détecte un numéro existant sans tenir compte de la casse ni des espaces", () => {
    assert.equal(codeDejaPris(POSTES, " op-01 "), true);
  });

  it("accepte un numéro libre", () => {
    assert.equal(codeDejaPris(POSTES, "OP-02"), false);
  });

  it("ignore le poste en cours de modification", () => {
    assert.equal(codeDejaPris(POSTES, "OP-01", "1"), false);
  });
});
