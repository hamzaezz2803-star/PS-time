import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adresseCarteIntegree, detecterAppareil, etatPropose, identifiantDepuisMatricule, lienCarte, photoPointageValide, positionValide } from "./pointage-distance.ts";

describe("identifiantDepuisMatricule", () => {
  it("met le matricule en minuscules", () => {
    assert.equal(identifiantDepuisMatricule(" T001 "), "t001");
    assert.equal(identifiantDepuisMatricule("emp-2026_01.a"), "emp-2026_01.a");
  });
  it("refuse un matricule trop court ou avec accent", () => {
    assert.equal(identifiantDepuisMatricule("T1"), null);
    assert.equal(identifiantDepuisMatricule("É001"), null);
  });
});

describe("detecterAppareil", () => {
  it("reconnaît un téléphone", () => {
    assert.equal(detecterAppareil("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148"), "telephone");
    assert.equal(detecterAppareil("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36"), "telephone");
  });
  it("reconnaît une tablette", () => {
    assert.equal(detecterAppareil("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)"), "tablette");
    assert.equal(detecterAppareil("Mozilla/5.0 (Linux; Android 13; SM-X200) Safari/537.36"), "tablette");
  });
  it("considère le reste comme un ordinateur", () => {
    assert.equal(detecterAppareil("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0"), "pc");
    assert.equal(detecterAppareil(""), "pc");
  });
});

describe("positionValide", () => {
  it("accepte une position de Casablanca", () => {
    assert.equal(positionValide({ latitude: 33.5731, longitude: -7.5898, precisionMetres: 12 }), true);
  });
  it("refuse des coordonnées hors bornes ou une précision inconnue", () => {
    assert.equal(positionValide({ latitude: 91, longitude: 0, precisionMetres: 5 }), false);
    assert.equal(positionValide({ latitude: 0, longitude: -181, precisionMetres: 5 }), false);
    assert.equal(positionValide({ latitude: 0, longitude: 0, precisionMetres: -1 }), false);
    assert.equal(positionValide({ latitude: Number.NaN, longitude: 0, precisionMetres: 5 }), false);
  });
});

describe("cartes", () => {
  it("centre la carte intégrée sur un repère fixe", () => {
    const adresse = adresseCarteIntegree(33.5731, -7.5898);
    assert.match(adresse, /^https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?/);
    assert.match(adresse, /marker=33\.5731,-7\.5898$/);
    assert.match(adresse, /bbox=-7\.5938,33\.5691,-7\.5858,33\.5771/);
  });
  it("donne un lien vers la position", () => {
    assert.equal(lienCarte(33.5731, -7.5898), "https://www.openstreetmap.org/?mlat=33.5731&mlon=-7.5898#map=17/33.5731/-7.5898");
  });
});

describe("etatPropose", () => {
  it("propose une entrée en début de journée, puis la suite logique", () => {
    assert.equal(etatPropose(null), "entree");
    assert.equal(etatPropose("entree"), "sortie");
    assert.equal(etatPropose("debut_pause"), "fin_pause");
    assert.equal(etatPropose("fin_pause"), "sortie");
    assert.equal(etatPropose("debut_heures_sup"), "fin_heures_sup");
    assert.equal(etatPropose("sortie"), "entree");
  });
});

describe("photoPointageValide", () => {
  const jpeg = (taille: number) => {
    const octets = new Uint8Array(taille);
    octets.set([0xff, 0xd8, 0xff]);
    return octets;
  };
  it("accepte un JPEG de 200 Ko au plus", () => {
    assert.equal(photoPointageValide(jpeg(50_000)), true);
    assert.equal(photoPointageValide(jpeg(204_800)), true);
  });
  it("refuse une image trop lourde, vide ou d'un autre format", () => {
    assert.equal(photoPointageValide(jpeg(204_801)), false);
    assert.equal(photoPointageValide(new Uint8Array()), false);
    assert.equal(photoPointageValide(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), false);
  });
});
