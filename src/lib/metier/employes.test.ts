import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  datesEmploiCoherentes,
  estDateValide,
  formaterTelephone,
  normaliserTelephone,
  validerValeurChamp,
} from "./employes.ts";

describe("normaliserTelephone", () => {
  it("convertit un numéro national marocain en E.164", () => {
    assert.equal(normaliserTelephone("06 12 34 56 78"), "+212612345678");
    assert.equal(normaliserTelephone("07.00.00.00.00"), "+212700000000");
  });

  it("accepte un numéro international, avec + ou 00", () => {
    assert.equal(normaliserTelephone("+212 6 12 34 56 78"), "+212612345678");
    assert.equal(normaliserTelephone("0033 6 00 00 00 00"), "+33600000000");
  });

  it("refuse un numéro incomplet ou contenant des lettres", () => {
    assert.equal(normaliserTelephone("0612"), null);
    assert.equal(normaliserTelephone("06 12 AB 56 78"), null);
  });
});

describe("formaterTelephone", () => {
  it("affiche un numéro marocain par paires", () => {
    assert.equal(formaterTelephone("+212612345678"), "06 12 34 56 78");
  });

  it("laisse un numéro étranger tel quel", () => {
    assert.equal(formaterTelephone("+33600000000"), "+33600000000");
  });
});

describe("estDateValide", () => {
  it("accepte une date réelle et refuse une date impossible", () => {
    assert.equal(estDateValide("2026-02-28"), true);
    assert.equal(estDateValide("2026-02-30"), false);
    assert.equal(estDateValide("28/02/2026"), false);
  });
});

describe("datesEmploiCoherentes", () => {
  it("refuse une fin d'emploi avant l'embauche", () => {
    assert.equal(datesEmploiCoherentes("2026-03-01", "2026-02-01"), false);
    assert.equal(datesEmploiCoherentes("2026-03-01", "2026-03-01"), true);
  });

  it("accepte des dates manquantes", () => {
    assert.equal(datesEmploiCoherentes(null, "2026-02-01"), true);
    assert.equal(datesEmploiCoherentes("2026-03-01", null), true);
  });
});

describe("validerValeurChamp", () => {
  it("transforme une saisie vide en null", () => {
    assert.deepEqual(validerValeurChamp("nombre", "   "), { ok: true, valeur: null });
  });

  it("accepte un nombre avec une virgule décimale", () => {
    assert.deepEqual(validerValeurChamp("nombre", "42,5"), { ok: true, valeur: "42.5" });
    assert.deepEqual(validerValeurChamp("nombre", "douze"), { ok: false, erreur: "nombre" });
  });

  it("vérifie les dates et la longueur des textes", () => {
    assert.deepEqual(validerValeurChamp("date", "2026-13-01"), { ok: false, erreur: "date" });
    assert.deepEqual(validerValeurChamp("texte", "x".repeat(256)), {
      ok: false,
      erreur: "tropLong",
    });
  });
});
