import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculerMotDePasseDuJour, motDePasseDuJour } from "./mot-de-passe-du-jour.ts";

describe("calculerMotDePasseDuJour", () => {
  it("reprend les exemples de la règle (addition sans retenue)", () => {
    assert.equal(calculerMotDePasseDuJour(15, 11, 7), "8301"); // dimanche : 1511 + 7890
    assert.equal(calculerMotDePasseDuJour(16, 11, 1), "2845"); // lundi : 1611 + 1234
  });

  it("ne garde que les unités de chaque somme (9 + 4 = 3)", () => {
    // 2912 + 6789 : 2+6=8, 9+7=6, 1+8=9, 2+9=1
    assert.equal(calculerMotDePasseDuJour(29, 12, 6), "8691");
  });

  it("complète le jour et le mois à deux chiffres", () => {
    // 0501 + 3456 : 3, 9, 5, 7
    assert.equal(calculerMotDePasseDuJour(5, 1, 3), "3957");
  });
});

describe("motDePasseDuJour", () => {
  it("prend la date dans le fuseau demandé, pas celle du serveur", () => {
    const instant = new Date("2026-11-15T20:00:00Z");
    assert.equal(motDePasseDuJour(instant, "UTC"), "8301"); // encore dimanche 15/11
    assert.equal(motDePasseDuJour(instant, "Asia/Tokyo"), "2845"); // déjà lundi 16/11 à 05:00
  });

  it("donne un mot de passe de quatre chiffres à Casablanca", () => {
    assert.match(motDePasseDuJour(new Date("2026-11-16T10:00:00Z"), "Africa/Casablanca"), /^\d{4}$/);
  });
});
