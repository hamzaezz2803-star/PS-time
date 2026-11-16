import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PLAGES_JOURNEE_TYPE, dureeRepasMinutes, plageDuPointage, pointValide, theoriqueMinutes, verifierPlages } from "./profil-horaire.ts";

const h = (heures: number, minutes = 0) => heures * 60 + minutes;

describe("verifierPlages", () => {
  it("accepte la journée type (bout à bout de 00:00 à 24:00)", () => {
    assert.equal(verifierPlages(PLAGES_JOURNEE_TYPE), null);
  });

  it("refuse un trou, une plage vide, une journée incomplète ou sans plage fixe", () => {
    assert.equal(verifierPlages([]), "vide");
    assert.equal(verifierPlages([{ debut: 0, fin: h(8), type: "interdite" }, { debut: h(9), fin: h(24), type: "fixe" }]), "trou");
    assert.equal(verifierPlages([{ debut: 0, fin: h(12), type: "fixe" }]), "trou");
    assert.equal(verifierPlages([{ debut: 0, fin: 0, type: "fixe" }, { debut: 0, fin: h(24), type: "fixe" }]), "duree_nulle");
    assert.equal(verifierPlages([{ debut: 0, fin: h(24), type: "variable" }]), "pas_de_fixe");
  });
});

describe("theoriqueMinutes et dureeRepasMinutes", () => {
  it("donnent 8 h de théorique et 2 h de repas pour la journée type", () => {
    assert.equal(theoriqueMinutes(PLAGES_JOURNEE_TYPE), h(8));
    assert.equal(dureeRepasMinutes(PLAGES_JOURNEE_TYPE), h(2));
  });
});

describe("pointValide", () => {
  it("reprend l'exemple du schéma : réel 7:30, 12:00, 13:30, 19:00 → validé 8, 12, 14, 18", () => {
    assert.equal(pointValide(PLAGES_JOURNEE_TYPE, h(7, 30), "arrivee"), h(8));
    assert.equal(pointValide(PLAGES_JOURNEE_TYPE, h(12), "depart"), h(12));
    assert.equal(pointValide(PLAGES_JOURNEE_TYPE, h(13, 30), "arrivee"), h(14));
    assert.equal(pointValide(PLAGES_JOURNEE_TYPE, h(19), "depart"), h(18));
  });

  it("garde l'heure réelle dans une plage fixe (retard ou départ anticipé)", () => {
    assert.equal(pointValide(PLAGES_JOURNEE_TYPE, h(8, 10), "arrivee"), h(8, 10));
    assert.equal(pointValide(PLAGES_JOURNEE_TYPE, h(17, 40), "depart"), h(17, 40));
  });

  it("refuse un pointage en plage interdite", () => {
    assert.equal(pointValide(PLAGES_JOURNEE_TYPE, h(6), "arrivee"), null);
    assert.equal(pointValide(PLAGES_JOURNEE_TYPE, h(20), "depart"), null);
  });
});

describe("plageDuPointage", () => {
  it("rattache un départ à la plage qu'il termine", () => {
    assert.equal(plageDuPointage(PLAGES_JOURNEE_TYPE, h(19), "depart")?.type, "variable");
    assert.equal(plageDuPointage(PLAGES_JOURNEE_TYPE, h(19), "arrivee")?.type, "interdite");
  });
});
