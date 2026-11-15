import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jourDansFuseau, jourEtMinuteLocaux, jourPrecedent } from "./dates.ts";

describe("jourDansFuseau", () => {
  it("donne le jour local, même près de minuit UTC", () => {
    // 23 h 30 UTC le 31 décembre = 0 h 30 le 1er janvier à Casablanca (UTC+1).
    assert.equal(jourDansFuseau(new Date("2025-12-31T23:30:00Z"), "Africa/Casablanca"), "2026-01-01");
  });
});

describe("jourEtMinuteLocaux", () => {
  it("donne le jour et la minute à l'heure de Paris", () => {
    assert.deepEqual(jourEtMinuteLocaux(new Date("2026-07-01T07:57:00Z"), "Europe/Paris"), { jour: "2026-07-01", minutes: 597 });
    assert.deepEqual(jourEtMinuteLocaux(new Date("2026-06-30T22:30:00Z"), "Europe/Paris"), { jour: "2026-07-01", minutes: 30 });
  });
});

describe("jourPrecedent", () => {
  it("recule d'un jour, mois et année compris", () => {
    assert.equal(jourPrecedent("2026-03-01"), "2026-02-28");
    assert.equal(jourPrecedent("2026-01-01"), "2025-12-31");
  });
});
