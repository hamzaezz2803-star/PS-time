import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PHOTO_TAILLE_MAX_OCTETS } from "../constantes.ts";
import { cadrageCarre, detecterTypePhoto, verifierPhoto } from "./photo.ts";

const octets = (...valeurs: number[]) => new Uint8Array([...valeurs, 0, 0, 0, 0]);
const JPEG = octets(0xff, 0xd8, 0xff, 0xe0);
const PNG = octets(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const WEBP = octets(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50);

describe("detecterTypePhoto", () => {
  it("reconnaît JPEG, PNG et WebP par leur signature", () => {
    assert.equal(detecterTypePhoto(JPEG), "image/jpeg");
    assert.equal(detecterTypePhoto(PNG), "image/png");
    assert.equal(detecterTypePhoto(WEBP), "image/webp");
  });

  it("refuse un autre fichier, même renommé en image", () => {
    // « <svg » : un SVG peut contenir du script, il n'est pas accepté.
    assert.equal(detecterTypePhoto(octets(0x3c, 0x73, 0x76, 0x67)), null);
    // RIFF qui n'est pas du WebP (ex. WAV).
    assert.equal(detecterTypePhoto(octets(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45)), null);
  });
});

describe("verifierPhoto", () => {
  it("accepte une image valide", () => {
    assert.deepEqual(verifierPhoto(PNG), { ok: true, type: "image/png" });
  });

  it("refuse un fichier vide ou trop lourd", () => {
    assert.deepEqual(verifierPhoto(new Uint8Array()), { ok: false, erreur: "taille" });
    const tropLourd = new Uint8Array(PHOTO_TAILLE_MAX_OCTETS + 1);
    tropLourd.set(JPEG);
    assert.deepEqual(verifierPhoto(tropLourd), { ok: false, erreur: "taille" });
  });

  it("refuse un format non accepté", () => {
    assert.deepEqual(verifierPhoto(octets(0x47, 0x49, 0x46, 0x38)), { ok: false, erreur: "format" });
  });
});

describe("cadrageCarre", () => {
  it("centre le carré dans une photo en largeur ou en hauteur", () => {
    assert.deepEqual(cadrageCarre(1200, 800), { x: 200, y: 0, cote: 800 });
    assert.deepEqual(cadrageCarre(600, 1001), { x: 0, y: 200, cote: 600 });
    assert.deepEqual(cadrageCarre(500, 500), { x: 0, y: 0, cote: 500 });
  });
});
