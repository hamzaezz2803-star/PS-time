import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aAccesAuModule, modulesAccessibles, nettoyerPages, PAGES_PROPOSEES, pagesAccessibles, pagesProposees, peutAcceder } from "./droits.ts";

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

describe("pages proposées dans le choix des droits", () => {
  it("ne propose plus Absences et événements (page masquée), mais garde les autres", () => {
    assert.equal(PAGES_PROPOSEES.includes("absences"), false);
    assert.deepEqual(pagesProposees("presence"), ["pointages_manuels", "evenements", "droits_conges", "compteurs", "detail_jour"]);
    assert.equal(PAGES_PROPOSEES.length, 19);
    assert.deepEqual(pagesProposees("etats"), ["etat_presences", "etat_evenements", "etat_conges", "etat_pointages"]);
  });
});
