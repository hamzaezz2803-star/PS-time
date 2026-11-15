import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bilanPointages, estDansLeFutur, heureLocaleVersUtc } from "./pointages.ts";

describe("heureLocaleVersUtc", () => {
  // Le décalage de Casablanca suit les décisions officielles (base des fuseaux du système) :
  // les tests comparent donc au décalage annoncé par cette base, pas à une valeur écrite en dur.
  it("convertit l'heure de Casablanca en UTC avec le décalage du jour", () => {
    const instant = heureLocaleVersUtc("2026-11-15", "09:57", "Africa/Casablanca");
    assert.ok(instant);
    const relu = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(instant);
    assert.equal(relu, "09:57");
  });

  it("passe au jour précédent en UTC juste après minuit", () => {
    assert.equal(heureLocaleVersUtc("2026-07-01", "00:30", "Europe/Paris")?.toISOString(), "2026-06-30T22:30:00.000Z");
  });

  it("suit les changements d'heure (été et hiver à Paris)", () => {
    assert.equal(heureLocaleVersUtc("2026-07-01", "12:00", "Europe/Paris")?.toISOString(), "2026-07-01T10:00:00.000Z");
    assert.equal(heureLocaleVersUtc("2026-01-15", "12:00", "Europe/Paris")?.toISOString(), "2026-01-15T11:00:00.000Z");
  });

  it("refuse une date ou une heure invalide", () => {
    assert.equal(heureLocaleVersUtc("2026-02-30", "08:00", "Africa/Casablanca"), null);
    assert.equal(heureLocaleVersUtc("2026-11-15", "24:00", "Africa/Casablanca"), null);
    assert.equal(heureLocaleVersUtc("15/11/2026", "08:00", "Africa/Casablanca"), null);
  });
});

describe("estDansLeFutur", () => {
  const maintenant = new Date("2026-11-15T09:00:00Z");

  it("tolère quelques minutes d'avance", () => {
    assert.equal(estDansLeFutur(new Date("2026-11-15T09:04:00Z"), maintenant), false);
  });

  it("refuse un pointage plus tard", () => {
    assert.equal(estDansLeFutur(new Date("2026-11-15T10:00:00Z"), maintenant), true);
  });
});

describe("bilanPointages", () => {
  it("compte les doublons ignorés", () => {
    assert.deepEqual(bilanPointages(5, 3), { enregistres: 3, doublons: 2 });
    assert.deepEqual(bilanPointages(2, 2), { enregistres: 2, doublons: 0 });
  });
});
