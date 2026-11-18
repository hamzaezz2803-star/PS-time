import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COULEURS_PERSONNALISEES_PAR_DEFAUT } from "../constantes.ts";
import { contraste, controlerContrastes, deriverPalette, melanger, normaliserCouleur, sontLisibles, variablesCouleurs } from "./couleurs.ts";

describe("normaliserCouleur", () => {
  it("accepte #rrggbb et le met en minuscules", () => {
    assert.equal(normaliserCouleur(" #0B4FB3 "), "#0b4fb3");
  });

  it("refuse tout autre format (protection contre l'injection CSS)", () => {
    for (const saisie of ["#fff", "0b4fb3", "red", "#0b4fb3;color:red", "url(x)"]) {
      assert.equal(normaliserCouleur(saisie), null);
    }
  });
});

describe("contraste", () => {
  it("donne 21 entre noir et blanc, 1 entre deux couleurs identiques", () => {
    assert.equal(Math.round(contraste("#000000", "#ffffff")), 21);
    assert.equal(contraste("#0b4fb3", "#0b4fb3"), 1);
  });

  it("calcule le contraste du bleu PS Time sur blanc (environ 7,6:1)", () => {
    assert.ok(Math.abs(contraste("#0b4fb3", "#ffffff") - 7.6) < 0.2);
  });
});

describe("melanger et deriverPalette", () => {
  it("mélange deux couleurs à parts égales", () => {
    assert.equal(melanger("#000000", "#ffffff", 0.5), "#808080");
  });

  it("déduit un survol plus sombre et un ciel très clair", () => {
    const palette = deriverPalette(COULEURS_PERSONNALISEES_PAR_DEFAUT);
    assert.ok(contraste(palette["primaire-survol"], "#ffffff") > contraste(palette.primaire, "#ffffff"));
    assert.ok(contraste(palette.ciel, "#ffffff") < 1.2);
  });

  it("produit les variables CSS du thème", () => {
    const variables = variablesCouleurs(COULEURS_PERSONNALISEES_PAR_DEFAUT);
    assert.equal(variables["--couleur-primaire"], "#0b4fb3");
    assert.ok(FORMAT.test(variables["--couleur-ciel"] ?? ""));
  });
});

const FORMAT = /^#[0-9a-f]{6}$/;

describe("controlerContrastes", () => {
  it("accepte les couleurs de départ", () => {
    assert.equal(sontLisibles(COULEURS_PERSONNALISEES_PAR_DEFAUT), true);
  });

  it("refuse une couleur primaire trop claire et un fond trop sombre", () => {
    const couleurs = { ...COULEURS_PERSONNALISEES_PAR_DEFAUT, primaire: "#7fb2f0", fond: "#8090a0" };
    const refusees = controlerContrastes(couleurs).filter((controle) => !controle.estLisible).map((controle) => controle.couleur);
    assert.deepEqual(refusees, ["primaire", "fond"]);
  });

  it("accepte toujours l'accent, purement décoratif", () => {
    const couleurs = { ...COULEURS_PERSONNALISEES_PAR_DEFAUT, accent: "#ffff00" };
    assert.equal(sontLisibles(couleurs), true);
  });
});
