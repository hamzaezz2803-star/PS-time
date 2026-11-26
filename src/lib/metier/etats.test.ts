import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { JourService } from "./compteurs/variables.ts";
import { estEtat, joursDeLaSaisie, lignesPresences } from "./etats.ts";
import type { EmployeStatistiques } from "./statistiques-presence.ts";

const HORAIRE = { debutPrevu: 480, finPrevue: 1020, dureePrevue: 480, estBadge: true };
const MAINTENANT = { jour: "2026-11-20", minute: 720 };
const journee = (jour: string, pointages: number[], horaire: JourService["horaire"] = HORAIRE): JourService => ({ jour, horaire, pointages });
const regles = { priorite: 10, neutralisePointage: false, type: "absence" as const };

const employe: EmployeStatistiques = {
  id: "a",
  departement: "Atelier",
  debutEmploi: null,
  finEmploi: null,
  jours: [journee("2026-11-16", [495, 1020]), journee("2026-11-17", []), journee("2026-11-18", []), journee("2026-11-19", [480]), journee("2026-11-21", [], null)],
  evenements: [
    { ...regles, id: "cp", code: "CP", nom: "Congé payé", debut: "2026-11-17", fin: "2026-11-19" },
    { ...regles, id: "mal", code: "MAL", nom: "Maladie", priorite: 50, debut: "2026-11-18", fin: "2026-11-18" },
  ],
};

describe("menu État", () => {
  it("reconnaît les états connus", () => {
    assert.equal(estEtat("presences"), true);
    assert.equal(estEtat("autre"), false);
  });

  it("donne une ligne par jour attendu, pointé ou avec un événement, du plus récent au plus ancien", () => {
    const lignes = lignesPresences([employe], MAINTENANT);
    assert.deepEqual(
      lignes.map((ligne) => [ligne.resume.jour, ligne.statut, ligne.resume.evenement?.code ?? null]),
      [
        ["2026-11-19", "a_l_heure", null],
        ["2026-11-18", "justifie", "MAL"],
        ["2026-11-17", "justifie", "CP"],
        ["2026-11-16", "en_retard", null],
      ],
    );
  });

  it("compte les jours prévus d'une saisie et ceux où elle est retenue", () => {
    // Congé du 17 au 19 : le 18 la maladie l'emporte, le 19 un pointage l'emporte.
    assert.deepEqual(joursDeLaSaisie(employe, { id: "cp", debut: "2026-11-17", fin: "2026-11-19" }), { prevus: 3, valides: 1 });
    assert.deepEqual(joursDeLaSaisie(employe, { id: "mal", debut: "2026-11-18", fin: "2026-11-18" }), { prevus: 1, valides: 1 });
  });
});
