import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODULE_DE_L_OBJET, estObjetNotification, modulesNotifications } from "./notifications.ts";

describe("modulesNotifications", () => {
  it("donne tout au super administrateur, administration comprise", () => {
    assert.deepEqual(modulesNotifications({ estSuperAdmin: true, modules: [] }), ["personnel", "planning", "presence", "administration"]);
  });

  it("limite un administrateur à ses modules, sans l'administration", () => {
    assert.deepEqual(modulesNotifications({ estSuperAdmin: false, modules: ["presence"] }), ["presence"]);
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
