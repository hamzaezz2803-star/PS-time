import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { statutJourDetail } from "./statut-jour-detail.ts";

const jour = { profilCode: "BUR", entree: 510, sortie: 1050, retardMinutes: 0, evenement: null };

describe("statutJourDetail", () => {
  it("à l'heure, en retard, sortie manquante, sans pointage", () => {
    assert.equal(statutJourDetail(jour), "a_l_heure");
    assert.equal(statutJourDetail({ ...jour, retardMinutes: 2 }), "retard");
    assert.equal(statutJourDetail({ ...jour, sortie: null, retardMinutes: 2 }), "incomplet");
    assert.equal(statutJourDetail({ ...jour, entree: null, sortie: null, retardMinutes: null }), "sans_pointage");
  });

  it("aujourd'hui, ni l'absence de sortie ni l'absence de pointage ne sont des anomalies", () => {
    assert.equal(statutJourDetail({ ...jour, sortie: null }, true), "en_cours");
    assert.equal(statutJourDetail({ ...jour, entree: null, sortie: null, retardMinutes: null }, true), "pas_encore_pointe");
    assert.equal(statutJourDetail({ ...jour, retardMinutes: 5 }, true), "retard");
  });

  it("un retard inconnu ne compte pas comme un retard", () => {
    assert.equal(statutJourDetail({ ...jour, retardMinutes: null }), "a_l_heure");
  });

  it("repos, et travail un jour de repos", () => {
    assert.equal(statutJourDetail({ ...jour, profilCode: null, entree: null, sortie: null }), "repos");
    assert.equal(statutJourDetail({ ...jour, profilCode: null }), "repos_travaille");
  });

  it("l'événement retenu passe avant les pointages", () => {
    assert.equal(statutJourDetail({ ...jour, entree: null, evenement: { code: "CP", nom: "Congé payé", type: "absence" } }), "absence_justifiee");
    assert.equal(statutJourDetail({ ...jour, evenement: { code: "MIS", nom: "Mission", type: "presence" } }), "evenement_presence");
  });
});
