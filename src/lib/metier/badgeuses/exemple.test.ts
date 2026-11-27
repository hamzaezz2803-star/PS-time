import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { etatHeure } from "./etat.ts";
import { badgeuseExemple, synchroniserExemple } from "./exemple.ts";

const MAINTENANT = new Date("2026-11-27T09:00:00Z");

describe("badgeuse d'exemple", () => {
  it("est en ligne avec une heure à régler, puis à l'heure après la synchronisation", () => {
    const exemple = badgeuseExemple(MAINTENANT, "UTC");
    assert.equal(exemple.statut, "en_ligne");
    assert.equal(exemple.heureAppareil, "2026-11-27 08:16:00");
    assert.equal(etatHeure(exemple.ecartSecondes, 60), "a_regler");

    const synchronisee = synchroniserExemple(exemple, MAINTENANT, "UTC");
    assert.equal(synchronisee.heureAppareil, "2026-11-27 09:00:00");
    assert.equal(etatHeure(synchronisee.ecartSecondes, 60), "a_l_heure");
  });
});
