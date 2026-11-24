import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACCES_PAR_DEFAUT,
  accesCoherent,
  appareilsVersTexte,
  decrireDoigt,
  doigtsVersTexte,
  normaliserAppareils,
  normaliserDoigts,
  texteVersAppareils,
  texteVersDoigts,
} from "./acces-pointage.ts";

describe("accès au pointage", () => {
  it("garde les appareils connus, sans doublon, dans l'ordre de la liste", () => {
    assert.deepEqual(normaliserAppareils(["telephone", "pc", "pc", "montre"]), ["pc", "telephone"]);
    assert.equal(appareilsVersTexte(["tablette", "pc"]), "pc,tablette");
    assert.deepEqual(texteVersAppareils(""), []);
    assert.deepEqual(texteVersAppareils("pc,telephone"), ["pc", "telephone"]);
  });

  it("garde les doigts de 0 à 9, sans doublon, triés", () => {
    assert.deepEqual(normaliserDoigts(["6", "5", "5", "12", "x", 9]), [5, 6, 9]);
    assert.equal(doigtsVersTexte([6, 5]), "56");
    assert.deepEqual(texteVersDoigts("56"), [5, 6]);
    assert.deepEqual(texteVersDoigts(""), []);
  });

  it("sans autorisation, efface appareils et conditions mais garde les doigts", () => {
    const acces = { ...ACCES_PAR_DEFAUT, appareils: ["pc" as const], exigePosition: true, exigePhoto: true, doigts: [5 as const] };
    assert.deepEqual(accesCoherent(acces), { ...ACCES_PAR_DEFAUT, doigts: [5] });
    assert.deepEqual(accesCoherent({ ...acces, pointageDistance: true }), { ...acces, pointageDistance: true });
  });

  it("décrit un doigt comme les badgeuses ZKTeco (4 = pouce gauche, 5 = pouce droit)", () => {
    assert.deepEqual(decrireDoigt(4), { main: "gauche", rang: 0 });
    assert.deepEqual(decrireDoigt(0), { main: "gauche", rang: 4 });
    assert.deepEqual(decrireDoigt(5), { main: "droite", rang: 0 });
    assert.deepEqual(decrireDoigt(9), { main: "droite", rang: 4 });
  });
});
