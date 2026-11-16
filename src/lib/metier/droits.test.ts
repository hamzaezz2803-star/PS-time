import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { modulesAccessibles, nettoyerModules, peutGerer } from "./droits.ts";

describe("peutGerer", () => {
  it("donne tout au super administrateur, même sans module accordé", () => {
    const superAdmin = { estSuperAdmin: true, modules: [] };
    assert.equal(peutGerer(superAdmin, "personnel"), true);
    assert.equal(peutGerer(superAdmin, "presence"), true);
  });

  it("limite un administrateur aux modules accordés", () => {
    const admin = { estSuperAdmin: false, modules: ["planning"] };
    assert.equal(peutGerer(admin, "planning"), true);
    assert.equal(peutGerer(admin, "personnel"), false);
  });

  it("ne donne rien à un administrateur sans module", () => {
    assert.deepEqual(modulesAccessibles({ estSuperAdmin: false, modules: [] }), []);
  });
});

describe("nettoyerModules", () => {
  it("retire les modules inconnus et les doublons, dans l'ordre du menu", () => {
    assert.deepEqual(nettoyerModules(["presence", "admin", "personnel", "presence"]), ["personnel", "presence"]);
  });
});
