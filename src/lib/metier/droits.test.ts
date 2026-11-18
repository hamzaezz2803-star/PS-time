import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aAccesAuModule, modulesAccessibles, nettoyerPages, pagesAccessibles, peutAcceder } from "./droits.ts";

describe("peutAcceder", () => {
  it("donne tout au super administrateur, même sans page accordée", () => {
    const superAdmin = { estSuperAdmin: true, pages: [] };
    assert.equal(peutAcceder(superAdmin, "sites"), true);
    assert.equal(peutAcceder(superAdmin, "detail_jour"), true);
  });

  it("limite un administrateur aux pages accordées, une par une", () => {
    const admin = { estSuperAdmin: false, pages: ["rotations"] };
    assert.equal(peutAcceder(admin, "rotations"), true);
    assert.equal(peutAcceder(admin, "groupes"), false);
    assert.equal(peutAcceder(admin, "personnes"), false);
  });
});

describe("aAccesAuModule", () => {
  it("ouvre un module dès qu'une de ses pages est accordée", () => {
    const admin = { estSuperAdmin: false, pages: ["compteurs"] };
    assert.equal(aAccesAuModule(admin, "presence"), true);
    assert.equal(aAccesAuModule(admin, "planning"), false);
    assert.deepEqual(modulesAccessibles(admin), ["presence"]);
  });

  it("ne donne rien à un administrateur sans page", () => {
    assert.deepEqual(modulesAccessibles({ estSuperAdmin: false, pages: [] }), []);
    assert.deepEqual(pagesAccessibles({ estSuperAdmin: false, pages: [] }), []);
  });
});

describe("nettoyerPages", () => {
  it("retire les pages inconnues et les doublons, dans l'ordre du menu", () => {
    assert.deepEqual(nettoyerPages(["detail_jour", "admin", "sites", "detail_jour", "personnel"]), ["sites", "detail_jour"]);
  });
});
