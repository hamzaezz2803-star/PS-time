import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APPARENCE_PAR_DEFAUT, apparenceDepuisReglages, estPolice, estTailleTexte, estTheme, reglagesDepuisApparence } from "./apparence.ts";

describe("apparenceDepuisReglages", () => {
  it("reprend le thème, la police, la taille et les couleurs enregistrés", () => {
    const reglages = [
      { cle: "theme", valeur: "personnalise" },
      { cle: "police", valeur: "inter" },
      { cle: "taille_texte", valeur: "grande" },
      { cle: "couleur_primaire", valeur: "#047857" },
    ];
    const apparence = apparenceDepuisReglages(reglages);
    assert.equal(apparence.theme, "personnalise");
    assert.equal(apparence.police, "inter");
    assert.equal(apparence.taille, "grande");
    assert.equal(apparence.couleurs.primaire, "#047857");
    assert.equal(apparence.couleurs.marine, APPARENCE_PAR_DEFAUT.couleurs.marine);
  });

  it("garde le choix par défaut quand rien n'est enregistré", () => {
    assert.deepEqual(apparenceDepuisReglages([]), APPARENCE_PAR_DEFAUT);
  });

  it("ignore une valeur inconnue ou une couleur mal écrite", () => {
    const reglages = [
      { cle: "theme", valeur: "violet" },
      { cle: "taille_texte", valeur: "enorme" },
      { cle: "couleur_fond", valeur: "red;}" },
    ];
    const apparence = apparenceDepuisReglages(reglages);
    assert.equal(apparence.theme, APPARENCE_PAR_DEFAUT.theme);
    assert.equal(apparence.taille, APPARENCE_PAR_DEFAUT.taille);
    assert.equal(apparence.couleurs.fond, APPARENCE_PAR_DEFAUT.couleurs.fond);
  });

  it("revient au thème par défaut si les couleurs personnalisées sont illisibles", () => {
    const reglages = [
      { cle: "theme", valeur: "personnalise" },
      { cle: "couleur_primaire", valeur: "#dddddd" },
    ];
    assert.equal(apparenceDepuisReglages(reglages).theme, APPARENCE_PAR_DEFAUT.theme);
  });

  it("relit exactement ce qui a été enregistré", () => {
    const apparence = { ...APPARENCE_PAR_DEFAUT, theme: "ocean" as const, taille: "tres_grande" as const };
    assert.deepEqual(apparenceDepuisReglages(reglagesDepuisApparence(apparence)), apparence);
  });
});

describe("estTheme, estPolice et estTailleTexte", () => {
  it("reconnaissent seulement les valeurs de l'application", () => {
    assert.equal(estTheme("personnalise"), true);
    assert.equal(estTheme("inter"), false);
    assert.equal(estPolice("source_sans"), true);
    assert.equal(estPolice("arial"), false);
    assert.equal(estTailleTexte("grande"), true);
    assert.equal(estTailleTexte("petite"), false);
  });
});
