import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODULE_DE_L_OBJET, estObjetNotification, objetsNotifications } from "./notifications.ts";

describe("objetsNotifications", () => {
  it("donne tout au super administrateur, administration comprise", () => {
    const objets = objetsNotifications({ estSuperAdmin: true, pages: [] });
    assert.equal(objets.length, Object.keys(MODULE_DE_L_OBJET).length);
    assert.ok(objets.includes("utilisateur"));
  });

  it("limite un administrateur aux objets de ses pages, sans l'administration", () => {
    assert.deepEqual(objetsNotifications({ estSuperAdmin: false, pages: ["pointages_manuels"] }), ["pointage"]);
    assert.deepEqual(objetsNotifications({ estSuperAdmin: false, pages: ["horaire_dynamique"] }), ["regle_horaire", "horaire_dynamique"]);
    // Pointages faits à distance par les employés : vus avec la page Détail jour, où ils s'affichent.
    assert.deepEqual(objetsNotifications({ estSuperAdmin: false, pages: ["detail_jour"] }), ["pointage_distance"]);
  });
});

describe("MODULE_DE_L_OBJET", () => {
  it("range chaque objet dans son module", () => {
    assert.equal(MODULE_DE_L_OBJET.employe, "personnel");
    assert.equal(MODULE_DE_L_OBJET.rotation, "planning");
    assert.equal(MODULE_DE_L_OBJET.pointage, "presence");
    assert.equal(MODULE_DE_L_OBJET.utilisateur, "administration");
  });

  it("reconnaît un objet connu", () => {
    assert.equal(estObjetNotification("site"), true);
    assert.equal(estObjetNotification("inconnu"), false);
  });
});
