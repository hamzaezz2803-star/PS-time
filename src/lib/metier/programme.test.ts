import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dureePauseMinutes,
  dureeServiceMinutes,
  dureeTravailMinutes,
  pauseDansService,
  finLeLendemain,
  formaterDuree,
  heureVersMinutes,
  jourDeSemaine,
  minutesVersHeure,
  numeroJourRotation,
  periodesSeChevauchent,
} from "./programme.ts";

describe("heures", () => {
  it("convertit dans les deux sens", () => {
    assert.equal(heureVersMinutes("09:05"), 545);
    assert.equal(heureVersMinutes("0:00"), 0);
    assert.equal(minutesVersHeure(545), "09:05");
    assert.equal(minutesVersHeure(1439), "23:59");
  });

  it("refuse une heure invalide", () => {
    assert.equal(heureVersMinutes("24:00"), null);
    assert.equal(heureVersMinutes("12:60"), null);
    assert.equal(heureVersMinutes("midi"), null);
  });
});

describe("durées", () => {
  it("calcule un service de jour", () => {
    assert.equal(dureeServiceMinutes(540, 1080), 540); // 09:00 à 18:00
    assert.equal(dureeTravailMinutes(540, 1080, 60), 480);
    assert.equal(finLeLendemain(540, 1080), false);
  });

  it("calcule un service de nuit qui finit le lendemain", () => {
    assert.equal(dureeServiceMinutes(1320, 360), 480); // 22:00 à 06:00
    assert.equal(finLeLendemain(1320, 360), true);
  });

  it("ne descend jamais sous zéro et s'affiche lisiblement", () => {
    assert.equal(dureeTravailMinutes(540, 600, 120), 0);
    assert.equal(formaterDuree(480), "8 h 00");
    assert.equal(formaterDuree(45), "0 h 45");
  });
});

describe("pause de … à …", () => {
  it("calcule sa durée, 0 sans pause", () => {
    assert.equal(dureePauseMinutes(720, 780), 60); // 12:00 à 13:00
    assert.equal(dureePauseMinutes(1410, 30), 60); // 23:30 à 00:30
    assert.equal(dureePauseMinutes(null, null), 0);
  });

  it("accepte une pause comprise dans le service, de jour comme de nuit", () => {
    assert.equal(pauseDansService(480, 1020, 720, 780), true); // 12:00-13:00 dans 08:00-17:00
    assert.equal(pauseDansService(1320, 360, 120, 150), true); // 02:00-02:30 dans 22:00-06:00
    assert.equal(pauseDansService(1320, 360, 1410, 30), true); // 23:30-00:30 dans 22:00-06:00
    assert.equal(pauseDansService(480, 1020, 960, 1020), true); // jusqu'à la fin du service
  });

  it("refuse une pause hors du service ou qui le déborde", () => {
    assert.equal(pauseDansService(480, 1020, 420, 450), false); // 07:00-07:30 avant le service
    assert.equal(pauseDansService(480, 1020, 990, 1050), false); // 16:30-17:30 déborde
    assert.equal(pauseDansService(1320, 360, 720, 780), false); // midi dans un service de nuit
    assert.equal(pauseDansService(480, 1020, 480, 1020), false); // tout le service
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
