import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODULE_DE_L_OBJET_HISTORIQUE, compterParAction, estActionHistorique, estObjetHistorique, grouperParJour, paginer } from "./historique.ts";

describe("MODULE_DE_L_OBJET_HISTORIQUE", () => {
  it("reprend les objets notifiés et ajoute exports et sessions", () => {
    assert.equal(MODULE_DE_L_OBJET_HISTORIQUE.employe, "personnel");
    assert.equal(MODULE_DE_L_OBJET_HISTORIQUE.rapport_presences, "planning");
    assert.equal(MODULE_DE_L_OBJET_HISTORIQUE.session, "administration");
    assert.equal(estObjetHistorique("session"), true);
    assert.equal(estObjetHistorique("inconnu"), false);
    assert.equal(estActionHistorique("export"), true);
    assert.equal(estActionHistorique("lecture"), false);
  });
});

describe("grouperParJour", () => {
  it("regroupe les entrées consécutives d'un même jour", () => {
    const entrees = [
      { id: "a", creeLe: new Date("2026-11-18T10:00:00Z") },
      { id: "b", creeLe: new Date("2026-11-18T08:00:00Z") },
      { id: "c", creeLe: new Date("2026-11-17T22:00:00Z") },
    ];
    const groupes = grouperParJour(entrees, (date) => date.toISOString().slice(0, 10));
    assert.deepEqual(groupes.map((groupe) => [groupe.jour, groupe.entrees.map((entree) => entree.id)]), [
      ["2026-11-18", ["a", "b"]],
      ["2026-11-17", ["c"]],
    ]);
  });

  it("renvoie une liste vide sans entrée", () => {
    assert.deepEqual(grouperParJour([], () => ""), []);
  });
});

describe("compterParAction", () => {
  it("donne chaque type d'action, à zéro s'il est absent, et ignore les inconnus", () => {
    const comptes = compterParAction([
      { action: "creation", total: 4 },
      { action: "export", total: 1 },
      { action: "piratage", total: 9 },
    ]);
    assert.equal(comptes.creation, 4);
    assert.equal(comptes.export, 1);
    assert.equal(comptes.suppression, 0);
    assert.equal(Object.values(comptes).reduce((a, b) => a + b, 0), 5);
  });
});

describe("paginer", () => {
  it("ramène la page demandée dans les bornes", () => {
    assert.deepEqual(paginer(120, 50, 2), { page: 2, pages: 3, decalage: 50 });
    assert.deepEqual(paginer(120, 50, 9), { page: 3, pages: 3, decalage: 100 });
    assert.deepEqual(paginer(120, 50, -1), { page: 1, pages: 3, decalage: 0 });
    assert.deepEqual(paginer(0, 50, 1), { page: 1, pages: 1, decalage: 0 });
  });
});
