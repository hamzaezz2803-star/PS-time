import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  datesEmploiCoherentes,
  estDateValide,
  formaterTelephone,
  normaliserTelephone,
  validerInformations,
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

describe("validerInformations", () => {
  it("garde les lignes complètes, nettoie les espaces et ignore les lignes vides", () => {
    const resultat = validerInformations([
      { libelle: "  Taille   de blouse ", valeur: " M " },
      { libelle: "", valeur: "  " },
    ]);
    assert.deepEqual(resultat.informations, [{ libelle: "Taille de blouse", valeur: "M" }]);
    assert.deepEqual(resultat.erreurs, {});
    assert.equal(resultat.estTropNombreuses, false);
  });

  it("exige le libellé et la valeur ensemble", () => {
    const resultat = validerInformations([
      { libelle: "Vestiaire", valeur: "" },
      { libelle: "", valeur: "12" },
    ]);
    assert.deepEqual(resultat.erreurs, {
      0: { valeur: "valeurVide" },
      1: { libelle: "libelleVide" },
    });
    assert.deepEqual(resultat.informations, []);
  });

  it("refuse deux fois le même libellé, sans tenir compte de la casse", () => {
    const resultat = validerInformations([
      { libelle: "Casier", valeur: "A1" },
      { libelle: "CASIER", valeur: "B2" },
    ]);
    assert.deepEqual(resultat.erreurs, { 1: { libelle: "libelleEnDouble" } });
  });

  it("borne les longueurs et le nombre de lignes", () => {
    const tropLong = validerInformations([{ libelle: "x".repeat(61), valeur: "y".repeat(256) }]);
    assert.deepEqual(tropLong.erreurs, { 0: { libelle: "libelleTropLong", valeur: "valeurTropLong" } });

    const lignes = Array.from({ length: 21 }, (_, index) => ({ libelle: `Info ${index}`, valeur: "x" }));
    assert.equal(validerInformations(lignes).estTropNombreuses, true);
  });
});
