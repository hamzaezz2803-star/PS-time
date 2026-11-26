import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RegleHoraire } from "./horaire-dynamique.ts";
import { bornerPeriode, lignesRapport, periodeRapide } from "./rapport-presences.ts";

// Données fictives. Lundi 16 et mardi 17 novembre 2026.
const h = (heures: number, minutes = 0) => heures * 60 + minutes;
const REGLES: RegleHoraire[] = [
  { id: "matin", debut: h(5), fin: h(9), jours: [1, 2, 3, 4, 5], profilId: "MAT", estActif: true },
  { id: "soir", debut: h(12), fin: h(15), jours: [1, 2, 3, 4, 5], profilId: "APM", estActif: true },
];

describe("rapport des présences", () => {
  it("garde le premier pointage de chaque jour et le profil reconnu, plus récent d'abord", () => {
    const lignes = lignesRapport(
      [
        { employeId: "e1", jour: "2026-11-16", minutes: h(17) },
        { employeId: "e1", jour: "2026-11-16", minutes: h(7, 50) },
        { employeId: "e1", jour: "2026-11-17", minutes: h(13) },
        { employeId: "e2", jour: "2026-11-17", minutes: h(10) },
      ],
      REGLES,
    );
    assert.deepEqual(lignes, [
      { employeId: "e1", jour: "2026-11-17", minutes: h(13), profilId: "APM", regleId: "soir" },
      { employeId: "e2", jour: "2026-11-17", minutes: h(10), profilId: null, regleId: null },
      { employeId: "e1", jour: "2026-11-16", minutes: h(7, 50), profilId: "MAT", regleId: "matin" },
    ]);
  });

  it("propose le mois en cours et les 7 derniers jours", () => {
    assert.deepEqual(periodeRapide("mois", "2026-11-17"), { du: "2026-11-01", au: "2026-11-17" });
    assert.deepEqual(periodeRapide("semaine", "2026-11-17"), { du: "2026-11-11", au: "2026-11-17" });
  });

  it("borne la période : pas de futur, début avant fin, longueur maximale", () => {
    assert.deepEqual(bornerPeriode({ du: "2026-11-01", au: "2026-12-31" }, "2026-11-17", 93), { du: "2026-11-01", au: "2026-11-17" });
    assert.deepEqual(bornerPeriode({ du: "2026-11-20", au: "2026-11-10" }, "2026-11-17", 93), { du: "2026-11-10", au: "2026-11-10" });
    assert.deepEqual(bornerPeriode({ du: "2025-01-01", au: "2026-11-17" }, "2026-11-17", 7), { du: "2026-11-11", au: "2026-11-17" });
  });
});
