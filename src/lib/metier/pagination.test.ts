import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lirePage } from "./pagination.ts";

describe("lirePage", () => {
  it("ramène la page entre 1 et le nombre de pages", () => {
    assert.equal(lirePage("2", 5), 2);
    assert.equal(lirePage("0", 5), 1);
    assert.equal(lirePage("9", 5), 5);
  });

  it("prend la première page si la valeur est absente, multiple ou invalide", () => {
    assert.equal(lirePage(undefined, 5), 1);
    assert.equal(lirePage(["2", "3"], 5), 1);
    assert.equal(lirePage("abc", 5), 1);
  });
});
