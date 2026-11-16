import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formaterDuree, formaterEcart, jourDeSemaine, minutesVersHeure, numeroJourRotation, periodesSeChevauchent } from "./programme.ts";

describe("heures et durées", () => {
  it("affiche les heures sur 24 h, fin de journée comprise", () => {
    assert.equal(minutesVersHeure(545), "09:05");
    assert.equal(minutesVersHeure(1440), "24:00");
  });

  it("affiche une durée lisiblement", () => {
    assert.equal(formaterDuree(480), "8 h 00");
    assert.equal(formaterDuree(45), "0 h 45");
  });
});

describe("rotations", () => {
  it("donne le jour de la semaine, lundi = 0", () => {
    assert.equal(jourDeSemaine("2026-11-16"), 0); // lundi
    assert.equal(jourDeSemaine("2026-11-15"), 6); // dimanche
  });

  it("suit le jour de la semaine pour une rotation hebdomadaire", () => {
    const hebdomadaire = { type: "hebdomadaire" as const, nombreJours: 7 };
    assert.equal(numeroJourRotation(hebdomadaire, "2026-11-01", "2026-11-18"), 2); // mercredi
  });

  it("recommence le cycle à partir du début de l'affectation", () => {
    const cycle = { type: "cycle" as const, nombreJours: 3 };
    assert.equal(numeroJourRotation(cycle, "2026-11-10", "2026-11-10"), 0);
    assert.equal(numeroJourRotation(cycle, "2026-11-10", "2026-11-12"), 2);
    assert.equal(numeroJourRotation(cycle, "2026-11-10", "2026-11-13"), 0);
  });

  it("ne s'applique pas avant le début de l'affectation", () => {
    const cycle = { type: "cycle" as const, nombreJours: 3 };
    assert.equal(numeroJourRotation(cycle, "2026-11-10", "2026-11-09"), null);
  });
});

describe("periodesSeChevauchent", () => {
  it("détecte un jour en commun, bornes comprises", () => {
    assert.equal(periodesSeChevauchent({ debut: "2026-01-01", fin: "2026-01-31" }, { debut: "2026-01-31", fin: null }), true);
  });

  it("accepte des périodes qui se suivent", () => {
    assert.equal(periodesSeChevauchent({ debut: "2026-01-01", fin: "2026-01-31" }, { debut: "2026-02-01", fin: null }), false);
  });

  it("considère une période sans fin comme ouverte", () => {
    assert.equal(periodesSeChevauchent({ debut: "2026-01-01", fin: null }, { debut: "2030-05-01", fin: "2030-05-02" }), true);
  });
});

describe("formaterEcart", () => {
  it("écrit les minutes seules sous une heure", () => {
    assert.equal(formaterEcart(12), "12 min");
    assert.equal(formaterEcart(65), "1 h 05");
  });
});
