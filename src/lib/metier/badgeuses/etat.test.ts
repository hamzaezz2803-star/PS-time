import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { etatHeure, fusionnerBadgeuse, heureLocale, heureVraisemblable, texteHeureLocale, trierBadgeuses, type EtatBadgeuse } from "./etat.ts";

const badgeuse = (adresse: string, statut: EtatBadgeuse["statut"]): EtatBadgeuse => ({
  adresse,
  statut,
  nom: null,
  numeroSerie: null,
  version: null,
  heureAppareil: null,
  ecartSecondes: null,
  utilisateurs: null,
  pointages: null,
  verifieLe: "2026-11-27T08:00:00.000Z",
});

describe("etatHeure", () => {
  it("tolère un petit écart, dans les deux sens", () => {
    assert.equal(etatHeure(null, 60), "inconnue");
    assert.equal(etatHeure(-60, 60), "a_l_heure");
    assert.equal(etatHeure(61, 60), "a_regler");
  });
});

describe("heureLocale", () => {
  it("donne l'heure murale du fuseau demandé", () => {
    const h = heureLocale(new Date("2026-11-27T07:05:09Z"), "Europe/Paris");
    assert.equal(texteHeureLocale(h), "2026-11-27 08:05:09");
  });
});

describe("heureVraisemblable", () => {
  it("refuse une heure hors des bornes du calendrier", () => {
    assert.equal(heureVraisemblable({ annee: 2026, mois: 11, jour: 27, heures: 8, minutes: 0, secondes: 0 }), true);
    assert.equal(heureVraisemblable({ annee: 2026, mois: 13, jour: 1, heures: 8, minutes: 0, secondes: 0 }), false);
  });
});

describe("trierBadgeuses et fusionnerBadgeuse", () => {
  it("met les badgeuses en ligne d'abord, puis trie par adresse", () => {
    const triees = trierBadgeuses([badgeuse("192.168.1.20", "injoignable"), badgeuse("192.168.1.9", "en_ligne"), badgeuse("192.168.1.3", "en_ligne")]);
    assert.deepEqual(triees.map((b) => b.adresse), ["192.168.1.3", "192.168.1.9", "192.168.1.20"]);
  });

  it("remplace la badgeuse de même adresse", () => {
    const liste = fusionnerBadgeuse([badgeuse("192.168.1.9", "en_ligne")], badgeuse("192.168.1.9", "injoignable"));
    assert.equal(liste.length, 1);
    assert.equal(liste[0].statut, "injoignable");
  });
});
